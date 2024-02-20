import { readFile as _readFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { autoService, name, singleton } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { YError, printStackTrace } from 'yerror';
import type { LogService } from 'common-services';

export enum NodeEnv {
  Test = 'test',
  Development = 'development',
  Production = 'production',
}

/* Architecture Note #1.6: `APP_ENV`

This is up to you to provide the `APP_ENV` service and its
 `AppEnv` type extending the `BaseAppEnv` one, something like
 this:
```ts
import { env } from 'node:process';
import { extractAppEnv, type BaseAppEnv } from 'application-services';

const APP_ENVS = ['local', 'test', 'staging', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

const APP_ENV = extractAppEnv<AppEnv>(env.APP_ENV, APP_ENVS);

// Do something with it, like declare a `knifecycle` constant.
```

Note that we made an utility function to help you extracting
 that value.
*/
export type BaseAppEnv = 'local';

export type BaseAppEnvVars = {
  NODE_ENV: NodeEnv;
  ISOLATED_ENV?: string;
};
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppEnvVars extends BaseAppEnvVars {}

const DEFAULT_BASE_ENV: Partial<AppEnvVars> = {};
const NODE_ENVS = Object.values(NodeEnv);

/* Architecture Note #1.3: `ENV`

The `ENV` service adds a layer of configuration over just using
 node's `process.env` value.
*/

export default singleton(name('ENV', autoService(initENV))) as typeof initENV;

export type ProcessEnvConfig = {
  BASE_ENV?: Partial<AppEnvVars>;
};
export type ProcessEnvDependencies<T extends BaseAppEnv> = ProcessEnvConfig & {
  APP_ENV: T;
  PROJECT_DIR: string;
  PROCESS_ENV: Partial<AppEnvVars>;
  log?: LogService;
  readFile?: typeof _readFile;
};

/**
 * Initialize the ENV service using process env plus dotenv files
 *  loaded in `.env.node.${ENV.NODE_ENV}` and `.env.app.${APP_ENV}`.
 * @param  {Object}   services
 * The services `ENV` depends on
 * @param  {Object}   [services.BASE_ENV]
 * Base env vars that will be added to the environment
 * @param  {Object}   services.APP_ENV
 * The injected `APP_ENV` value
 * @param  {Object}   services.PROCESS_ENV
 * The injected `process.env` value
 * @param  {Object}   services.PROJECT_DIR
 * The NodeJS project directory
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the actual env vars.
 */
async function initENV<T extends BaseAppEnv>({
  BASE_ENV = DEFAULT_BASE_ENV,
  APP_ENV,
  PROCESS_ENV,
  PROJECT_DIR,
  log = noop,
  readFile = _readFile,
}: ProcessEnvDependencies<T>): Promise<AppEnvVars> {
  let ENV: Partial<AppEnvVars> = BASE_ENV.NODE_ENV
    ? {
        NODE_ENV: BASE_ENV.NODE_ENV,
      }
    : {};

  log('debug', `♻️ - Loading the environment service.`);

  /* Architecture Note #1.3.1: Environment isolation
  Per default, we take the process environment as is
   but since it could lead to leaks when building
   projects statically so one can isolate the process
   env by using the `ISOLATED_ENV` environment variable.
  */
  if (!PROCESS_ENV.ISOLATED_ENV) {
    ENV = { ...ENV, ...PROCESS_ENV };
    log('debug', `🖥 - Using the process env.`);
  } else {
    log('warning', `🖥 - Using an isolated env.`);
  }

  if (!ENV.NODE_ENV) {
    log(
      'warning',
      `⚠ - NODE_ENV environment variable is not set, setting it to "${NodeEnv.Development}".`,
    );
    ENV.NODE_ENV = NodeEnv.Development;
  }

  if (!NODE_ENVS.includes(ENV.NODE_ENV)) {
    log(
      'error',
      `❌ - Non-standard NODE_ENV value detected: "${ENV.NODE_ENV}".`,
    );
    throw new YError('E_BAD_NODE_ENV', ENV.NODE_ENV, NODE_ENVS);
  }

  /* Architecture Note #1.3.2: `.env.node.${NODE_ENV}` files

  You may want to set some env vars depending on the
   `NODE_ENV`. We use `dotenv` to provide your such
   ability.
  */
  const nodeEnvFile = `.env.node.${ENV.NODE_ENV}`;

  /* Architecture Note #1.3.3: `.env.app.${APP_ENV}` files
  You may need to keep some secrets out of your Git
   history fo each deployment targets too.
  */
  const appEnvFile = `.env.app.${APP_ENV}`;

  /* Architecture Note #1.3.4: evaluation order
  The final environment is composed from the different sources
   in this order:
  - the `.env.node.${NODE_ENV}` file content if exists
  - the `.env.app.${APP_ENV}` file content if exists
  - the process ENV (so that one can override values by
     adding environment variables).
  */
  ENV = (
    await Promise.all([
      BASE_ENV,
      _readEnvFile({ PROJECT_DIR, readFile, log }, nodeEnvFile),
      _readEnvFile({ PROJECT_DIR, readFile, log }, appEnvFile),
      ENV,
    ])
  ).reduce((ENV, A_ENV) => ({ ...ENV, ...A_ENV }), {});

  log('warning', `🔂 - Running with "${ENV.NODE_ENV}" node environment.`);
  log('warning', `🔂 - Running with "${APP_ENV}" application environment.`);

  return ENV as AppEnvVars;
}

async function _readEnvFile<T extends BaseAppEnv>(
  {
    PROJECT_DIR,
    readFile,
    log,
  }: Required<
    Pick<ProcessEnvDependencies<T>, 'PROJECT_DIR' | 'readFile' | 'log'>
  >,
  filePath: string,
): Promise<Partial<AppEnvVars>> {
  const fullFilePath = path.join(PROJECT_DIR, filePath);

  log('debug', `💾 - Trying to load .env file at "${fullFilePath}".`);

  try {
    const buf = await readFile(fullFilePath);
    const FILE_ENV = dotenv.parse(buf);

    log('warning', `🖬 - Loaded .env file at "${fullFilePath}".`);

    return FILE_ENV;
  } catch (err) {
    log('debug', `🚫 - No file found at "${fullFilePath}".`);
    log('debug-stack', printStackTrace(err as Error));
    return {};
  }
}
