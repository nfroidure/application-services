import { readFile as _readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { parse as parseDotEnv } from 'dotenv';
import {
  autoService,
  name,
  singleton,
  location,
  type ServiceProperties,
} from 'knifecycle';
import { noop } from 'common-services';
import { YError, printStackTrace } from 'yerror';
import { type LogService } from 'common-services';

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

export interface BaseAppEnvVars {
  NODE_ENV: NodeEnv;
  ISOLATED_ENV?: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppEnvVars extends BaseAppEnvVars {}

export const DEFAULT_BASE_ENV: Partial<AppEnvVars> = {};
export const NODE_ENVS = Object.values(NodeEnv);

/* Architecture Note #1.3: `ENV`

The `ENV` service adds a layer of configuration over just using
 node's `process.env` value.
*/

export type ProcessEnvSecretFileOptions = {
  /** Whether non existing secret files lead to failure or not */
  silentlyFail?: 'all' | 'none' | string[];
  /** To avoid removing the secrets file env vars */
  leaveSecretFileEnvVar?: boolean;
  /** Trim file content (defaults to 'end-new-line') */
  trim?: 'none' | 'all' | 'start' | 'end' | 'end-new-line';
} & (
  | {
      /** Prefix to detect secrets to load in files */
      prefix: string;
    }
  | {
      /** Suffix to detect secrets to load in files */
      suffix: string;
    }
);
export interface ProcessEnvConfig {
  BASE_ENV?: Partial<AppEnvVars>;
  ENV_SECRETS_FILES?: ProcessEnvSecretFileOptions;
}
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
 * @param  {Object}   [services.ENV_SECRETS_FILES]
 * Options allowing to detect env vars to load in secret files
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
  ENV_SECRETS_FILES,
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
  log('warning', `🔴 - Running with "${APP_ENV}" application environment.`);

  /* Architecture Note #1.3.1: Environment isolation
  Per default, we take the process environment as is
   but since it could lead to leaks when building
   projects statically so one can isolate the process
   env by setting the `ISOLATED_ENV` environment variable
   to anything different of 0 or FALSE (case insensitive).
  */
  if (
    typeof PROCESS_ENV.ISOLATED_ENV !== 'undefined' &&
    PROCESS_ENV.ISOLATED_ENV !== '0' &&
    PROCESS_ENV.ISOLATED_ENV.toUpperCase() !== 'FALSE'
  ) {
    log('warning', `🖥 - Using an isolated env.`);
  } else {
    ENV = { ...ENV, ...PROCESS_ENV };
    log('debug', `🖥 - Using the process env.`);
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
    throw new YError('E_BAD_NODE_ENV', [ENV.NODE_ENV, NODE_ENVS]);
  }

  const FINAL_NODE_ENV = ENV.NODE_ENV;

  log('warning', `🔂 - Running with "${FINAL_NODE_ENV}" node environment.`);

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
      readEnvFile({ PROJECT_DIR, readFile, log }, nodeEnvFile),
      readEnvFile({ PROJECT_DIR, readFile, log }, appEnvFile),
      ENV,
    ])
  ).reduce((ENV, A_ENV) => ({ ...ENV, ...A_ENV }), {});

  if (ENV_SECRETS_FILES) {
    for (const key of Object.keys(ENV)) {
      if (
        'prefix' in ENV_SECRETS_FILES
          ? key.startsWith(ENV_SECRETS_FILES.prefix)
          : key.endsWith(ENV_SECRETS_FILES.suffix)
      ) {
        ENV = await readSecretFile(
          { ENV_SECRETS_FILES, PROJECT_DIR, readFile, log },
          ENV,
          key as keyof AppEnvVars,
        );
      }
    }
  }

  if (ENV.NODE_ENV !== FINAL_NODE_ENV) {
    log(
      'error',
      `❌ - Illegal attempt to change the NODE_ENV value via env files: "${ENV.NODE_ENV}".`,
    );
    throw new YError('E_BAD_ENV', [ENV.NODE_ENV as string, FINAL_NODE_ENV]);
  }

  return ENV as AppEnvVars;
}

export async function readEnvFile<T extends BaseAppEnv>(
  {
    PROJECT_DIR,
    readFile,
    log,
  }: Required<
    Pick<ProcessEnvDependencies<T>, 'PROJECT_DIR' | 'readFile' | 'log'>
  >,
  filePath: string,
): Promise<Partial<AppEnvVars>> {
  const fullFilePath = join(PROJECT_DIR, filePath);

  log('debug', `💾 - Trying to load .env file at "${fullFilePath}".`);

  try {
    const buf = await readFile(fullFilePath);
    const FILE_ENV = parseDotEnv(buf);

    log('warning', `🖬 - Loaded .env file at "${fullFilePath}".`);

    return FILE_ENV;
  } catch (err) {
    log('debug', `🚫 - No file found at "${fullFilePath}".`);
    log('debug-stack', printStackTrace(err as Error));
    return {};
  }
}

/**
 * Extracts a secret from a file. Useful if you prefer
 *  extracting your secrets yourself considering the
 *  ENV service as unsafe.
 */
export async function readSecretFile<T extends BaseAppEnv>(
  {
    ENV_SECRETS_FILES,
    PROJECT_DIR,
    readFile,
    log,
  }: Required<
    Pick<
      ProcessEnvDependencies<T>,
      'ENV_SECRETS_FILES' | 'PROJECT_DIR' | 'readFile' | 'log'
    >
  >,
  ENV: Partial<AppEnvVars>,
  name: keyof AppEnvVars,
): Promise<Partial<AppEnvVars>> {
  const filePath = ENV[name] ?? '';
  const fullFilePath = filePath
    ? isAbsolute(filePath)
      ? filePath
      : join(PROJECT_DIR, filePath)
    : '';
  const newName = (
    'prefix' in ENV_SECRETS_FILES
      ? name.slice(ENV_SECRETS_FILES.prefix.length)
      : name.slice(0, name.length - ENV_SECRETS_FILES.suffix.length)
  ) as keyof AppEnvVars;

  log(
    'debug',
    `💾 - Trying to load "${name}" secret file at "${fullFilePath}" (resolved from "${filePath}").`,
  );

  try {
    const buf = await readFile(fullFilePath);
    const secret = buf.toString();

    log('warning', `🖬 - Loaded ${newName} secret at "${fullFilePath}".`);

    (ENV as Record<string, string>)[newName] =
      !ENV_SECRETS_FILES.trim || ENV_SECRETS_FILES.trim === 'end-new-line'
        ? secret.replace(/\r?\n$/, '')
        : ENV_SECRETS_FILES.trim === 'end'
          ? secret.trimEnd()
          : ENV_SECRETS_FILES.trim === 'all'
            ? secret.trim()
            : ENV_SECRETS_FILES.trim === 'start'
              ? secret.trimStart()
              : secret;
  } catch (err) {
    log('debug', `🚫 - No file found at "${fullFilePath}".`);
    log('debug-stack', printStackTrace(err as Error));
    if (
      !ENV_SECRETS_FILES.silentlyFail ||
      ENV_SECRETS_FILES.silentlyFail === 'none' ||
      (ENV_SECRETS_FILES.silentlyFail !== 'all' &&
        !ENV_SECRETS_FILES.silentlyFail.includes(name))
    ) {
      throw YError.wrap(err as Error, 'E_SECRET_FILE_NOT_FOUND', [
        name,
        filePath,
        fullFilePath,
      ]);
    }
  }

  if (!ENV_SECRETS_FILES.leaveSecretFileEnvVar) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ENV as Record<string, unknown>)[name as string];
  }

  return ENV;
}

export default location(
  singleton(name('ENV', autoService(initENV))),
  import.meta.url,
) as unknown as ServiceProperties & typeof initENV;
