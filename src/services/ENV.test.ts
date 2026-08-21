import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { readFile as _readFile } from 'node:fs/promises';
import initENV, { NodeEnv } from './ENV.js';
import { type AppEnvVars } from './ENV.js';
import { type LogService } from 'common-services';
import { YError } from 'yerror';

describe('initENV', () => {
  const log = jest.fn<LogService>();
  const readFile = jest.fn<typeof _readFile>();

  beforeEach(() => {
    log.mockReset();
    readFile.mockReset();
  });

  it('should work with existing file', async () => {
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `DEV_MODE=1
ISOLATED_ENV=1
DB_HOST = 'test1.localhost'
`,
      ),
    );
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `DB_PASSWORD=oudelali
DB_HOST = 'test2.localhost'
ISOLATED_ENV=
`,
      ),
    );

    const ENV = await initENV({
      APP_ENV: 'local',
      BASE_ENV: { ISOLATED_ENV: '1', NODE_ENV: NodeEnv.Production },
      PROCESS_ENV: { ISOLATED_ENV: '0' },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "ENV": {
         "DB_HOST": "test2.localhost",
         "DB_PASSWORD": "oudelali",
         "DEV_MODE": "1",
         "ISOLATED_ENV": "0",
         "NODE_ENV": "production",
       },
       "logCalls": [
         [
           "debug",
           "♻️ - Loading the environment service.",
         ],
         [
           "warning",
           "🔴 - Running with "local" application environment.",
         ],
         [
           "debug",
           "🖥 - Using the process env.",
         ],
         [
           "warning",
           "🔂 - Running with "production" node environment.",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "warning",
           "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "warning",
           "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
       ],
       "readFileCalls": [
         [
           "/home/whoami/my-whook-project/.env.node.production",
         ],
         [
           "/home/whoami/my-whook-project/.env.app.local",
         ],
       ],
     }
    `);
  });

  it('should load secrets in files (prefix)', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockResolvedValueOnce(Buffer.from('my\r\ndb_secret\r\n'));
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockResolvedValueOnce(Buffer.from('my\njwt_secret \n'));

    const ENV = await initENV({
      ENV_SECRETS_FILES: {
        prefix: 'SECRET_FILE_',
        silentlyFail: 'all',
      },
      APP_ENV: 'local',
      BASE_ENV: {
        ISOLATED_ENV: '1',
        NODE_ENV: NodeEnv.Production,
        SECRET_FILE_DB_PASSWORD: './secrets/db_password',
        SECRET_FILE_DO_NOT_EXIST: '/var/secrets/null',
        SECRET_FILE_EMPTY: '',
        SECRET_FILE_JWT_SECRET: '/var/secrets/jwt_secret',
      } as AppEnvVars,
      PROCESS_ENV: {
        ISOLATED_ENV: '1',
      },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "ENV": {
         "DB_PASSWORD": "my
     db_secret",
         "ISOLATED_ENV": "1",
         "JWT_SECRET": "my
     jwt_secret ",
         "NODE_ENV": "production",
       },
       "logCalls": [
         [
           "debug",
           "♻️ - Loading the environment service.",
         ],
         [
           "warning",
           "🔴 - Running with "local" application environment.",
         ],
         [
           "warning",
           "🖥 - Using an isolated env.",
         ],
         [
           "warning",
           "🔂 - Running with "production" node environment.",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "debug",
           "💾 - Trying to load "SECRET_FILE_DB_PASSWORD" secret file at "/home/whoami/my-whook-project/secrets/db_password" (resolved from "./secrets/db_password").",
         ],
         [
           "warning",
           "🖬 - Loaded DB_PASSWORD secret at "/home/whoami/my-whook-project/secrets/db_password".",
         ],
         [
           "debug",
           "💾 - Trying to load "SECRET_FILE_DO_NOT_EXIST" secret file at "/var/secrets/null" (resolved from "/var/secrets/null").",
         ],
         [
           "debug",
           "🚫 - No file found at "/var/secrets/null".",
         ],
         [
           "debug",
           "💾 - Trying to load "SECRET_FILE_EMPTY" secret file at "" (resolved from "").",
         ],
         [
           "debug",
           "🚫 - No file found at "".",
         ],
         [
           "debug",
           "💾 - Trying to load "SECRET_FILE_JWT_SECRET" secret file at "/var/secrets/jwt_secret" (resolved from "/var/secrets/jwt_secret").",
         ],
         [
           "warning",
           "🖬 - Loaded JWT_SECRET secret at "/var/secrets/jwt_secret".",
         ],
       ],
       "readFileCalls": [
         [
           "/home/whoami/my-whook-project/.env.node.production",
         ],
         [
           "/home/whoami/my-whook-project/.env.app.local",
         ],
         [
           "/home/whoami/my-whook-project/secrets/db_password",
         ],
         [
           "/var/secrets/null",
         ],
         [
           "",
         ],
         [
           "/var/secrets/jwt_secret",
         ],
       ],
     }
    `);
  });

  it('should load secrets in files (suffix)', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));
    readFile.mockResolvedValueOnce(Buffer.from(' my_db_secret \r\n'));
    readFile.mockResolvedValueOnce(Buffer.from(' my_jwt_secret \n'));

    const ENV = await initENV({
      ENV_SECRETS_FILES: {
        suffix: '_FILE',
        silentlyFail: 'none',
        leaveSecretFileEnvVar: true,
        trim: 'all',
      },
      APP_ENV: 'local',
      BASE_ENV: {
        ISOLATED_ENV: '1',
        NODE_ENV: NodeEnv.Production,
        DB_PASSWORD_FILE: './secrets/db_password',
        JWT_SECRET_FILE: '/var/secrets/jwt_secret',
      } as AppEnvVars,
      PROCESS_ENV: {
        ISOLATED_ENV: '1',
      },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "ENV": {
         "DB_PASSWORD": "my_db_secret",
         "DB_PASSWORD_FILE": "./secrets/db_password",
         "ISOLATED_ENV": "1",
         "JWT_SECRET": "my_jwt_secret",
         "JWT_SECRET_FILE": "/var/secrets/jwt_secret",
         "NODE_ENV": "production",
       },
       "logCalls": [
         [
           "debug",
           "♻️ - Loading the environment service.",
         ],
         [
           "warning",
           "🔴 - Running with "local" application environment.",
         ],
         [
           "warning",
           "🖥 - Using an isolated env.",
         ],
         [
           "warning",
           "🔂 - Running with "production" node environment.",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "debug",
           "💾 - Trying to load "DB_PASSWORD_FILE" secret file at "/home/whoami/my-whook-project/secrets/db_password" (resolved from "./secrets/db_password").",
         ],
         [
           "warning",
           "🖬 - Loaded DB_PASSWORD secret at "/home/whoami/my-whook-project/secrets/db_password".",
         ],
         [
           "debug",
           "💾 - Trying to load "JWT_SECRET_FILE" secret file at "/var/secrets/jwt_secret" (resolved from "/var/secrets/jwt_secret").",
         ],
         [
           "warning",
           "🖬 - Loaded JWT_SECRET secret at "/var/secrets/jwt_secret".",
         ],
       ],
       "readFileCalls": [
         [
           "/home/whoami/my-whook-project/.env.node.production",
         ],
         [
           "/home/whoami/my-whook-project/.env.app.local",
         ],
         [
           "/home/whoami/my-whook-project/secrets/db_password",
         ],
         [
           "/var/secrets/jwt_secret",
         ],
       ],
     }
    `);
  });

  it('should fail with bad secrets in files', async () => {
    readFile.mockRejectedValue(new Error('EEXISTS'));

    try {
      await initENV({
        ENV_SECRETS_FILES: {
          prefix: 'SECRET_FILE_',
          silentlyFail: ['SECRET_FILE_DB_PASSWORD'],
        },
        APP_ENV: 'local',
        BASE_ENV: {
          ISOLATED_ENV: '1',
          NODE_ENV: NodeEnv.Production,
          SECRET_FILE_DB_PASSWORD: './secrets/db_password',
          SECRET_FILE_DO_NOT_EXIST: '/var/secrets/null',
          SECRET_FILE_JWT_SECRET: '/var/secrets/jwt_secret',
        } as AppEnvVars,
        PROCESS_ENV: {
          ISOLATED_ENV: '1',
        },
        PROJECT_DIR: '/home/whoami/my-whook-project',
        log,
        readFile: readFile as typeof _readFile,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readFileCalls: readFile.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_SECRET_FILE_NOT_FOUND (["SECRET_FILE_DO_NOT_EXIST","/var/secrets/null","/var/secrets/null"]): E_SECRET_FILE_NOT_FOUND],
         "logCalls": [
           [
             "debug",
             "♻️ - Loading the environment service.",
           ],
           [
             "warning",
             "🔴 - Running with "local" application environment.",
           ],
           [
             "warning",
             "🖥 - Using an isolated env.",
           ],
           [
             "warning",
             "🔂 - Running with "production" node environment.",
           ],
           [
             "debug",
             "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.production".",
           ],
           [
             "debug",
             "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
           ],
           [
             "debug",
             "🚫 - No file found at "/home/whoami/my-whook-project/.env.node.production".",
           ],
           [
             "debug",
             "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.local".",
           ],
           [
             "debug",
             "💾 - Trying to load "SECRET_FILE_DB_PASSWORD" secret file at "/home/whoami/my-whook-project/secrets/db_password" (resolved from "./secrets/db_password").",
           ],
           [
             "debug",
             "🚫 - No file found at "/home/whoami/my-whook-project/secrets/db_password".",
           ],
           [
             "debug",
             "💾 - Trying to load "SECRET_FILE_DO_NOT_EXIST" secret file at "/var/secrets/null" (resolved from "/var/secrets/null").",
           ],
           [
             "debug",
             "🚫 - No file found at "/var/secrets/null".",
           ],
         ],
         "readFileCalls": [
           [
             "/home/whoami/my-whook-project/.env.node.production",
           ],
           [
             "/home/whoami/my-whook-project/.env.app.local",
           ],
           [
             "/home/whoami/my-whook-project/secrets/db_password",
           ],
           [
             "/var/secrets/null",
           ],
         ],
       }
      `);
    }
  });

  it('should work respect the documentation precedence', async () => {
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `A_PROCESS_ENV_VAR=do_not_keep_that_value
A_APP_ENV_VAR=do_not_keep_that_value
A_NODE_ENV_VAR=keep_that_value
`,
      ),
    );
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `A_PROCESS_ENV_VAR=do_not_keep_that_value
A_APP_ENV_VAR=keep_that_value
`,
      ),
    );

    const ENV = await initENV({
      APP_ENV: 'local',
      BASE_ENV: {
        A_PROCESS_ENV_VAR: 'do_not_keep_that_value',
        A_BASE_ENV_VAR: 'keep_that_value',
      } as Partial<AppEnvVars>,
      PROCESS_ENV: {
        A_PROCESS_ENV_VAR: 'keep_that_value',
        NODE_ENV: NodeEnv.Production,
      } as AppEnvVars,
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "ENV": {
         "A_APP_ENV_VAR": "keep_that_value",
         "A_BASE_ENV_VAR": "keep_that_value",
         "A_NODE_ENV_VAR": "keep_that_value",
         "A_PROCESS_ENV_VAR": "keep_that_value",
         "NODE_ENV": "production",
       },
       "logCalls": [
         [
           "debug",
           "♻️ - Loading the environment service.",
         ],
         [
           "warning",
           "🔴 - Running with "local" application environment.",
         ],
         [
           "debug",
           "🖥 - Using the process env.",
         ],
         [
           "warning",
           "🔂 - Running with "production" node environment.",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "warning",
           "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.node.production".",
         ],
         [
           "warning",
           "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
       ],
       "readFileCalls": [
         [
           "/home/whoami/my-whook-project/.env.node.production",
         ],
         [
           "/home/whoami/my-whook-project/.env.app.local",
         ],
       ],
     }
    `);
  });

  it('should work with non-existing env files', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));

    const ENV = await initENV({
      APP_ENV: 'local',
      BASE_ENV: { ISOLATED_ENV: '0' },
      PROCESS_ENV: { ISOLATED_ENV: '1' },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "ENV": {
         "ISOLATED_ENV": "0",
         "NODE_ENV": "development",
       },
       "logCalls": [
         [
           "debug",
           "♻️ - Loading the environment service.",
         ],
         [
           "warning",
           "🔴 - Running with "local" application environment.",
         ],
         [
           "warning",
           "🖥 - Using an isolated env.",
         ],
         [
           "warning",
           "⚠ - NODE_ENV environment variable is not set, setting it to "development".",
         ],
         [
           "warning",
           "🔂 - Running with "development" node environment.",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.development".",
         ],
         [
           "debug",
           "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.node.development".",
         ],
         [
           "debug",
           "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.local".",
         ],
       ],
       "readFileCalls": [
         [
           "/home/whoami/my-whook-project/.env.node.development",
         ],
         [
           "/home/whoami/my-whook-project/.env.app.local",
         ],
       ],
     }
    `);
  });
});
