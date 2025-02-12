import { join as pathJoin, extname } from 'node:path';
import { autoService, singleton, name, location } from 'knifecycle';
import { noop } from 'common-services';
import { printStackTrace, YError } from 'yerror';
import { type ImporterService, type LogService } from 'common-services';
import { type BaseAppEnv, type ProcessEnvConfig } from './ENV.js';

/* Architecture Note #1.4: `APP_CONFIG`

The `APP_CONFIG` service allows to manage a typed application
 configuration by selectively loading the configuration file
 according to the `APP_ENV` environment variable.
*/

export type BaseAppConfig = ProcessEnvConfig;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppConfig extends BaseAppConfig {}
export type AppConfigDependencies<T extends BaseAppEnv> = {
  APP_ENV: T;
  MAIN_FILE_URL: string;
  importer: ImporterService<{ default: AppConfig }>;
  log?: LogService;
};

export default location(
  name('APP_CONFIG', singleton(autoService(initAppConfig))),
  import.meta.url,
) as typeof initAppConfig;

/**
 * Initialize the APP_CONFIG service according to the APP_ENV
 * @param  {Object}   services
 * The services `APP_CONFIG` depends on
 * @param  {Object}   services.APP_ENV
 * The injected `APP_ENV` value
 * @param  {String}   services.MAIN_FILE_URL
 * An URL pointing to the main file run
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
async function initAppConfig<T extends BaseAppEnv>({
  APP_ENV,
  MAIN_FILE_URL,
  importer,
  log = noop,
}: AppConfigDependencies<T>): Promise<AppConfig> {
  log('debug', `🏭 - Initializing the APP_CONFIG service.`);

  const projectExtension = extname(MAIN_FILE_URL);
  const configPath = new URL(
    pathJoin('.', 'config', APP_ENV, 'config' + projectExtension),
    MAIN_FILE_URL,
  ).toString();

  log('warning', `⚡ - Loading configurations from "${configPath}".`);

  try {
    return (await importer(configPath)).default;
  } catch (err) {
    log('warning', `☢ - Could not load configuration file "${configPath}".`);
    log('debug-stack', printStackTrace(err as Error));
    throw YError.wrap(err as Error, 'E_NO_CONFIG', configPath);
  }
}
