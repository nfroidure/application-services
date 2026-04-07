import { printStackTrace } from 'yerror';
import process from 'node:process';
import {
  autoProvider,
  singleton,
  location,
  type FatalErrorService,
  type Knifecycle,
  type ServiceProperties,
} from 'knifecycle';
import { noop } from 'common-services';
import { type LogService } from 'common-services';
import { type AppEnvVars, type BaseAppEnv } from './ENV.js';

const DEFAULT_SIGNALS: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

export interface ProcessService {
  service: NodeJS.Process;
  dispose: () => Promise<void>;
}
export interface ProcessServiceConfig {
  PROCESS_NAME?: string;
  SIGNALS?: NodeJS.Signals[];
}
export type ProcessServiceDependencies<T extends BaseAppEnv> =
  ProcessServiceConfig & {
    ENV: AppEnvVars;
    APP_ENV: T;
    exit: typeof process.exit;
    $instance: Knifecycle;
    $fatalError: FatalErrorService;
    log?: LogService;
  };

/* Architecture Note #1.5: Process
The `process` service takes care of the process status.

It returns nothing and should be injected only for its
 side effects.
*/

/**
 * Instantiate the process service
 * @name initProcess
 * @function
 * @param  {Object}   services
 * The services `process` depends on
 * @param  {Object}   services.APP_ENV
 * The injected `APP_ENV` value
 * @param  {Object}   [services.PROCESS_NAME]
 * The process name to display
 * @param  {Object}   [services.SIGNALS]
 * The process signals that interrupt the process
 * @param  {Object}   [services.exit]
 * A `process.exit` like function
 * @param  {Object}   services.$instance
 * The Knifecycle instance
 * @param  {Object}   services.$fatalError
 * The Knifecycle fatal error manager
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of the process object
 */
async function initProcess<T extends BaseAppEnv>({
  ENV,
  APP_ENV,
  PROCESS_NAME = '',
  SIGNALS = DEFAULT_SIGNALS,
  log = noop,
  exit,
  $instance,
  $fatalError,
}: ProcessServiceDependencies<T>): Promise<ProcessService> {
  const signalsListeners = SIGNALS.map<
    [NodeJS.Signals, (signal: NodeJS.Signals) => void]
  >((signal) => [signal, terminate.bind(null, signal)]);
  let shuttingDown = false;

  /* Architecture Note #1.5.1: Process name

  It also set the process name with the actual NODE_ENV.
  */
  process.title = `${
    PROCESS_NAME || process.title
  } - ${APP_ENV}:${ENV.NODE_ENV}`;

  /* Architecture Note #1.5.2: Signals handling

  It also handle SIGINT and SIGTERM signals to allow to
   gracefully shutdown the running process. The signals
   to handle can be customized by injecting the `SIGNALS`
   optional dependencies.
  */
  signalsListeners.forEach(([signal, signalListener]) => {
    process.on(signal, signalListener);
  });

  /* Architecture Note #1.5.3: Handling services fatal errors

  If an error occurs it attempts to gracefully exit
  to give it a chance to finish properly.
  */
  $fatalError.errorPromise.catch((err) => {
    log('error', '💀 - Fatal error');
    log('error-stack', printStackTrace(err as Error));
    terminate('FATAL');
  });

  /* Architecture Note #1.5.4: Uncaught exceptions

  If an uncaught exception occurs it also attempts to
   gracefully exit since a process should never be kept
   alive when an uncaught exception is raised.
  */
  process.on('uncaughtException', catchUncaughtException);

  function catchUncaughtException(err: Error) {
    log('error', '💀 - Uncaught Exception');
    log('error-stack', printStackTrace(err as Error));
    terminate('ERR');
  }

  function terminate(signal: NodeJS.Signals | 'ERR' | 'FATAL') {
    if (shuttingDown) {
      log('warning', `🚦 - ${signal} received again, shutdown now.`);
      exit(1);
    } else {
      log(
        'warning',
        `🚦 - ${signal} received. Send it again to kill me instantly.`,
      );
      shutdown(['ERR', 'FATAL'].includes(signal) ? 1 : 0);
    }
  }

  async function shutdown(code: number) {
    shuttingDown = true;
    log('warning', 'Shutting down now 🙏...');
    await $instance.destroy();

    try {
      log('warning', '😎 - Gracefull shutdown sucessfully done !');
      exit(code);
    } catch (err) {
      log('error', '🤔 - Could not gracefully shutdown.');
      log('error-stack', printStackTrace(err as Error));
      exit(code);
    }
  }

  async function dispose() {
    process.removeListener('uncaughtException', catchUncaughtException);
    signalsListeners.forEach(([signal, signalListener]) => {
      process.removeListener(signal, signalListener);
    });
  }

  log('debug', '📇 - Process service initialized.');
  return {
    service: process,
    dispose,
  };
}

export default location(
  singleton(autoProvider(initProcess)),
  import.meta.url,
) as unknown as ServiceProperties & typeof initProcess;
