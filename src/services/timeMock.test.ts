import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { Knifecycle, constant } from 'knifecycle';
import initTimeMockService, { type ClockMockService } from './timeMock.js';
import { type TimeService, type LogService } from 'common-services';

describe('TimeMock service', () => {
  const log = jest.fn<LogService>();
  const time = jest.fn<TimeService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should allow to set fixed time', async () => {
    const CLOCK_MOCK: ClockMockService = {
      mockedTime: Date.parse('2012-12-20T20:20:20Z'),
      isFixed: true,
    };

    const timeMock = await initTimeMockService({ CLOCK_MOCK, time, log });
    const currentTime = timeMock();

    expect({
      currentDate: new Date(currentTime).toISOString(),
      timeCalls: time.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "currentDate": "2012-12-20T20:20:20.000Z",
  "logCalls": [
    [
      "warning",
      "⏳ - Time mock is enabled!",
    ],
    [
      "debug",
      "⏰ - Picked a mocked timestamp:",
      1356034820000,
    ],
  ],
  "timeCalls": [],
}
`);
  });

  test('should allow to set relative time', async () => {
    const CLOCK_MOCK: ClockMockService = {
      referenceTime: Date.parse('2020-12-20T20:20:20Z'),
      mockedTime: Date.parse('2012-12-20T20:20:20Z'),
      isFixed: false,
    };

    time.mockReturnValueOnce(Date.parse('2020-12-20T20:20:40Z'));

    const timeMock = await initTimeMockService({ CLOCK_MOCK, time, log });
    const currentTime = timeMock();

    expect({
      currentDate: new Date(currentTime).toISOString(),
      timeCalls: time.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "currentDate": "2012-12-20T20:20:40.000Z",
  "logCalls": [
    [
      "warning",
      "⏳ - Time mock is enabled!",
    ],
    [
      "debug",
      "⏰ - Picked a mocked timestamp:",
      1356034840000,
    ],
  ],
  "timeCalls": [
    [],
  ],
}
`);
  });

  test('should work with Knifecycle', async () => {
    const CLOCK_MOCK: ClockMockService = {
      mockedTime: Date.parse('2012-12-20T20:20:20Z'),
      isFixed: true,
    };

    await new Knifecycle()
      .register(initTimeMockService)
      .register(constant('CLOCK_MOCK', CLOCK_MOCK))
      .register(constant('time', time))
      .register(constant('log', log))
      .run(['timeMock']);

    expect(log.mock.calls).toMatchInlineSnapshot(`
[
  [
    "warning",
    "⏳ - Time mock is enabled!",
  ],
]
`);
  });
});
