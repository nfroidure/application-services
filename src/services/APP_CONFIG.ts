import { autoService, singleton, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import path from 'path';
import { printStackTrace, YError } from 'yerror';
import type { BaseAppEnv, ImporterService, LogService } from 'common-services';

/* Architecture Note #1.4: `APP_CONFIG`

The `APP_CONFIG` service allows to manage a typed application
 configuration by selectively loading the configuration file
 according to the `APP_ENV` environment variable.
*/

export type BaseAppConfig = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppConfig extends BaseAppConfig {}
export type AppConfigDependencies<T extends BaseAppEnv> = {
  APP_ENV: T;
  PROJECT_SRC: string;
  importer: ImporterService<{ default: AppConfig }>;
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
async function initAppConfig<T extends BaseAppEnv>({
  APP_ENV,
  PROJECT_SRC,
  importer,
  log = noop,
}: AppConfigDependencies<T>): Promise<AppConfig> {
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
