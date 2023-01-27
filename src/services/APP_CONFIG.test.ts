import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initCONFIGS from './APP_CONFIG.js';
import { YError } from 'yerror';
import { AppEnv } from './ENV.js';
import type { ImporterService, LogService } from 'common-services';

type TestAppConfig = {
  CONFIG: {
    testConfig: string;
  };
};

describe('initCONFIGS', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<{ default: TestAppConfig }>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  it('should work with existing configs', async () => {
    importer.mockResolvedValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });

    const CONFIGS = await initCONFIGS<TestAppConfig, AppEnv>({
      APP_ENV: AppEnv.Local,
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      log,
      importer,
    });

    expect({
      CONFIGS,
      logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      importerCalls: importer.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "CONFIGS": {
          "CONFIG": {
            "testConfig": "test",
          },
        },
        "importerCalls": [
          [
            "/home/whoami/my-whook-project/src/config/local/config.js",
          ],
        ],
        "logCalls": [
          [
            "debug",
            "🏭 - Initializing the APP_CONFIG service.",
          ],
          [
            "warning",
            "⚡ - Loading configurations from "/home/whoami/my-whook-project/src/config/local/config.js".",
          ],
        ],
      }
    `);
  });

  it('should fail with non-existing file', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('EEXISTS');
    });

    try {
      await initCONFIGS<TestAppConfig, AppEnv>({
        APP_ENV: AppEnv.Production,
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        log,
        importer,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
        {
          "errorCode": "E_NO_CONFIG",
          "errorParams": [
            "/home/whoami/my-whook-project/src/config/production/config.js",
          ],
          "importerCalls": [
            [
              "/home/whoami/my-whook-project/src/config/production/config.js",
            ],
          ],
          "logCalls": [
            [
              "debug",
              "🏭 - Initializing the APP_CONFIG service.",
            ],
            [
              "warning",
              "⚡ - Loading configurations from "/home/whoami/my-whook-project/src/config/production/config.js".",
            ],
            [
              "warning",
              "☢ - Could not load configuration file "/home/whoami/my-whook-project/src/config/production/config.js".",
            ],
          ],
        }
      `);
    }
  });
});
