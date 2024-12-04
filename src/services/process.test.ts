import {
  describe,
  afterEach,
  beforeEach,
  test,
  expect,
  jest,
} from '@jest/globals';
import { YError } from 'yerror';
import { Knifecycle, constant } from 'knifecycle';
import initProcessService from './process.js';
import { NodeEnv } from './ENV.js';
import { type LogService } from 'common-services';

describe('Process service', () => {
  const log = jest.fn<LogService>();
  const savedProcessName = global.process.title;
  const processListenerStub = jest.spyOn(global.process, 'on');
  let exit;
  let exitPromise;
  let fatalErrorDeferred;

  beforeEach(() => {
    exitPromise = new Promise((resolve) => {
      exit = jest.fn(resolve);
    });
    processListenerStub.mockClear();
    log.mockReset();
  });

  afterEach(() => {
    global.process.title = savedProcessName;
  });

  describe('', () => {
    beforeEach(async () => {
      await initProcessService({
        PROCESS_NAME: 'Kikooolol',
        APP_ENV: 'local',
        ENV: { NODE_ENV: NodeEnv.Development },
        log,
        exit,
        $instance: { destroy: () => Promise.resolve() } as Knifecycle,
        $fatalError: {
          errorPromise: new Promise((resolve, reject) => {
            fatalErrorDeferred = { resolve, reject };
          }),
          registerErrorPromise: jest.fn(),
          unregisterErrorPromise: jest.fn(),
          throwFatalError: jest.fn(),
        },
      });
    });

    test('should work', () => {
      expect(log.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "debug",
            "📇 - Process service initialized.",
          ],
        ]
      `);
      expect(global.process.title).toEqual('Kikooolol - local:development');
      expect(processListenerStub.mock.calls.length).toEqual(3);
    });

    test('should handle fatal errors', async () => {
      fatalErrorDeferred.reject(new YError('E_AOUCH'));

      await exitPromise;

      expect(exit.mock.calls).toEqual([[1]]);
    });

    test('should handle uncaught exceptions', async () => {
      (
        processListenerStub.mock.calls.find(
          (call) => 'uncaughtException' === call[0],
        ) as [unknown, (err: Error) => void]
      )[1](new YError('E_AOUCH'));

      await exitPromise;
      expect(exit.mock.calls).toEqual([[1]]);
    });

    ['SIGINT', 'SIGTERM'].forEach((signal) =>
      test('should handle `signal`', async () => {
        (
          processListenerStub.mock.calls.find((call) => signal === call[0]) as [
            unknown,
            (err: Error) => void,
          ]
        )[1](new YError('E_AOUCH'));

        await exitPromise;
        expect(exit.mock.calls).toEqual([[0]]);
      }),
    );
  });

  test('should work with Knifecycle', async () => {
    await new Knifecycle()
      .register(initProcessService)
      .register(constant('APP_ENV', 'local'))
      .register(constant('ENV', { NODE_ENV: 'test' }))
      .register(constant('log', log))
      .register(constant('exit', exit))
      .run(['process']);

    expect(log.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "debug",
          "📇 - Process service initialized.",
        ],
      ]
    `);
  });
});
