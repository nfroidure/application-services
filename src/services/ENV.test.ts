import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initENV from './ENV.js';
import { NodeEnv } from 'common-services';
import type { AppEnvVars } from './ENV.js';
import type { LogService } from 'common-services';

describe('initENV', () => {
  const log = jest.fn<LogService>();
  const readFile = jest.fn<(path: string) => Promise<Buffer>>();

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
      NODE_ENV: NodeEnv.Development,
      APP_ENV: 'local',
      APP_CONFIG: { BASE_ENV: { ISOLATED_ENV: '1' } },
      PROCESS_ENV: { ISOLATED_ENV: '0' },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile,
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
    "ISOLATED_ENV": "1",
  },
  "logCalls": [
    [
      "debug",
      "♻️ - Loading the environment service.",
    ],
    [
      "warning",
      "🖥 - Using an isolated env.",
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
      "warning",
      "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.node.development".",
    ],
    [
      "warning",
      "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.app.local".",
    ],
    [
      "warning",
      "🔂 - Running with "development" node environment.",
    ],
    [
      "warning",
      "🔂 - Running with "local" application environment.",
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

  it('should work respect the documentation precedence', async () => {
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `A_BASE_ENV_VAR=do_not_keep_that_value
A_PROCESS_ENV_VAR=do_not_keep_that_value
A_APP_ENV_VAR=do_not_keep_that_value
A_NODE_ENV_VAR=keep_that_value
`,
      ),
    );
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `A_BASE_ENV_VAR=do_not_keep_that_value
A_PROCESS_ENV_VAR=do_not_keep_that_value
A_APP_ENV_VAR=keep_that_value
`,
      ),
    );

    const ENV = await initENV({
      NODE_ENV: NodeEnv.Development,
      APP_ENV: 'local',
      APP_CONFIG: {
        BASE_ENV: {
          A_PROCESS_ENV_VAR: 'do_not_keep_that_value',
          A_BASE_ENV_VAR: 'keep_that_value',
        } as AppEnvVars,
      },
      PROCESS_ENV: { A_PROCESS_ENV_VAR: 'keep_that_value' } as AppEnvVars,
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile,
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
  },
  "logCalls": [
    [
      "debug",
      "♻️ - Loading the environment service.",
    ],
    [
      "debug",
      "🖥 - Using the process env.",
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
      "warning",
      "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.node.development".",
    ],
    [
      "warning",
      "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.app.local".",
    ],
    [
      "warning",
      "🔂 - Running with "development" node environment.",
    ],
    [
      "warning",
      "🔂 - Running with "local" application environment.",
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

  it('should fail with non-existing file', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));

    const ENV = await initENV({
      NODE_ENV: NodeEnv.Development,
      APP_ENV: 'local',
      APP_CONFIG: { BASE_ENV: { ISOLATED_ENV: '0' } },
      PROCESS_ENV: { ISOLATED_ENV: '1' },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "ENV": {
    "ISOLATED_ENV": "0",
  },
  "logCalls": [
    [
      "debug",
      "♻️ - Loading the environment service.",
    ],
    [
      "warning",
      "🖥 - Using an isolated env.",
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
    [
      "warning",
      "🔂 - Running with "development" node environment.",
    ],
    [
      "warning",
      "🔂 - Running with "local" application environment.",
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
