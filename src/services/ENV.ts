import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { autoService, name, singleton } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { NodeEnv } from 'common-services';
import { YError, printStackTrace } from 'yerror';
import type { BaseAppEnv, LogService } from 'common-services';
import { AppConfig } from './APP_CONFIG.js';

export type BaseAppEnvVars = {
  NODE_ENV?: string;
  ISOLATED_ENV?: string;
};
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppEnvVars extends BaseAppEnvVars {}

const NODE_ENVS = Object.values(NodeEnv);

/* Architecture Note #1.3: `ENV`

The `ENV` service adds a layer of configuration over just using
 node's `process.env` value.
*/

export default singleton(name('ENV', autoService(initENV))) as typeof initENV;

export type ENVConfig = {
  BASE_ENV?: AppEnvVars;
};
export type ENVDependencies<T extends BaseAppEnv> = {
  NODE_ENV: NodeEnv;
  APP_ENV: T;
  PROJECT_DIR: string;
  PROCESS_ENV: AppEnvVars;
  APP_CONFIG?: AppConfig;
  log?: LogService;
  readFile?: typeof _readFile;
};

/**
 * Initialize the ENV service using process env plus dotenv files
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to look for `.env.${NODE_ENV}` env file
 * @param  {Object}   services.PROJECT_DIR
 * The NodeJS project directory
 * @param  {Object}   [services.BASE_ENV={}]
 * An optional base environment
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the actual env vars.
 */
async function initENV<T extends BaseAppEnv>({
  NODE_ENV,
  APP_ENV,
  PROJECT_DIR,
  PROCESS_ENV,
  APP_CONFIG,
  log = noop,
  readFile = _readFile,
}: ENVDependencies<T>): Promise<AppEnvVars> {
  let ENV = { ...(APP_CONFIG?.BASE_ENV || {}) };

  log('debug', `♻️ - Loading the environment service.`);

  if (!NODE_ENVS.includes(NODE_ENV)) {
    log('error', `❌ - Non-standard NODE_ENV value detected: "${NODE_ENV}".`);
    throw new YError('E_BAD_NODE_ENV', NODE_ENV, NODE_ENVS);
  }

  /* Architecture Note #1.1.1: Environment isolation
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

  /* Architecture Note #1.1.2: `.env.node.${NODE_ENV}` files

  You may want to set some env vars depending on the
   `NODE_ENV`. We use `dotenv` to provide your such
   ability.
  */
  const nodeEnvFile = `.env.node.${NODE_ENV}`;

  /* Architecture Note #1.1.3: `.env.app.${APP_ENV}` files
  You may need to keep some secrets out of your Git
   history fo each deployment targets too.
  */
  const appEnvFile = `.env.app.${APP_ENV}`;

  /* Architecture Note #1.1.a: evaluation order
  The final environment is composed from the differents sources
   in this order:
  - the `.env.node.${NODE_ENV}` file content if exists
  - the `.env.app.${APP_ENV}` file content if exists
  - the process ENV (so that one can override values by
     adding environment variables).
  */
  ENV = (
    await Promise.all([
      _readEnvFile({ PROJECT_DIR, readFile, log }, nodeEnvFile),
      _readEnvFile({ PROJECT_DIR, readFile, log }, appEnvFile),
      ENV,
    ])
  ).reduce((ENV, A_ENV) => ({ ...ENV, ...A_ENV }), {});

  log('warning', `🔂 - Running with "${NODE_ENV}" node environment.`);
  log('warning', `🔂 - Running with "${APP_ENV}" application environment.`);

  return ENV;
}

async function _readFile(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

async function _readEnvFile<T extends BaseAppEnv>(
  {
    PROJECT_DIR,
    readFile,
    log,
  }: Required<Pick<ENVDependencies<T>, 'PROJECT_DIR' | 'readFile' | 'log'>>,
  filePath: string,
): Promise<AppEnvVars> {
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
