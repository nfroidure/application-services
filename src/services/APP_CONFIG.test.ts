import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initAppConfig from './APP_CONFIG.js';
import { NodeEnv } from './ENV.js';
import type { AppConfig } from './APP_CONFIG.js';
import type { ImporterService, LogService } from 'common-services';

describe('initAppConfig', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<{ default: AppConfig }>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  it('should work with existing configs', async () => {
    importer.mockResolvedValueOnce({
      default: {
        BASE_ENV: {
          NODE_ENV: NodeEnv.Test,
        },
      },
    });

    const APP_CONFIG = await initAppConfig({
      APP_ENV: 'local',
      MAIN_FILE_URL: 'file:///home/whoami/my-whook-project/src/index.js',
      log,
      importer,
    });

    expect({
      APP_CONFIG,
      logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      importerCalls: importer.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "APP_CONFIG": {
    "BASE_ENV": {
      "NODE_ENV": "test",
    },
  },
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/config/local/config.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🏭 - Initializing the APP_CONFIG service.",
    ],
    [
      "warning",
      "⚡ - Loading configurations from "file:///home/whoami/my-whook-project/src/config/local/config.js".",
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
      await initAppConfig({
        APP_ENV: 'local',
        MAIN_FILE_URL: 'file:///home/whoami/my-whook-project/src/index.js',
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
    "file:///home/whoami/my-whook-project/src/config/local/config.js",
  ],
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/config/local/config.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🏭 - Initializing the APP_CONFIG service.",
    ],
    [
      "warning",
      "⚡ - Loading configurations from "file:///home/whoami/my-whook-project/src/config/local/config.js".",
    ],
    [
      "warning",
      "☢ - Could not load configuration file "file:///home/whoami/my-whook-project/src/config/local/config.js".",
    ],
  ],
}
`);
    }
  });
});
