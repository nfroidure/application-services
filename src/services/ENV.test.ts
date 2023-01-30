import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initENV from './ENV.js';
import { NodeEnv } from './ENV.js';
import type { BaseAppEnv } from './ENV.js';
import type { LogService } from 'common-services';

type TestAppEnv = BaseAppEnv | 'production';

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
      BASE_ENV: { ISOLATED_ENV: '1' },
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
          "ISOLATED_ENV": "",
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

  it('should fail with non-existing file', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));

    const ENV = await initENV<TestAppEnv>({
      NODE_ENV: NodeEnv.Development,
      APP_ENV: 'production',
      BASE_ENV: { ISOLATED_ENV: '0' },
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
            "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.production".",
          ],
          [
            "debug",
            "🚫 - No file found at "/home/whoami/my-whook-project/.env.node.development".",
          ],
          [
            "debug",
            "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.production".",
          ],
          [
            "warning",
            "🔂 - Running with "development" node environment.",
          ],
          [
            "warning",
            "🔂 - Running with "production" application environment.",
          ],
        ],
        "readFileCalls": [
          [
            "/home/whoami/my-whook-project/.env.node.development",
          ],
          [
            "/home/whoami/my-whook-project/.env.app.production",
          ],
        ],
      }
    `);
  });
});
