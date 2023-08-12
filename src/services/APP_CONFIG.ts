import { autoService, singleton, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import path from 'path';
import { printStackTrace, YError } from 'yerror';
import type { ImporterService, LogService } from 'common-services';
import type { BaseAppEnv } from './ENV.js';

/* Architecture Note #1.4: `APP_CONFIG`

The `APP_CONFIG` service allows to manage a typed application
 configuration by selectively loading the configuration file
 according to the `APP_ENV` environment variable.
*/

export type BaseAppConfig = Record<string, unknown>;
export type AppConfigDependencies<T, U extends string = BaseAppEnv> = {
  APP_ENV: U;
  PROJECT_SRC: string;
  importer: ImporterService<{ default: T }>;
  log?: LogService;
};

export default name(
  'APP_CONFIG',
  singleton(autoService(initAppConfig)),
) as typeof initAppConfig;

/**
 * Initialize the APP_CONFIG service according to the APP_ENV
 * @param  {Object}   services
 * The services APP_CONFIG depends on
 * @param  {Object}   services.APP_ENV
 * The injected APP_ENV value
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
async function initAppConfig<T, U extends string = BaseAppEnv>({
  APP_ENV,
  PROJECT_SRC,
  importer,
  log = noop,
}: AppConfigDependencies<T, U>): Promise<T> {
  log('debug', `🏭 - Initializing the APP_CONFIG service.`);

  const configPath = path.join(PROJECT_SRC, 'config', APP_ENV, 'config.js');

  log('warning', `⚡ - Loading configurations from "${configPath}".`);

  try {
    return (await importer(configPath)).default;
  } catch (err) {
    log('warning', `☢ - Could not load configuration file "${configPath}".`);
    log('debug-stack', printStackTrace(err as Error));
    throw YError.wrap(err as Error, 'E_NO_CONFIG', configPath);
  }
}
