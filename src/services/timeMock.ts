import { autoService, singleton, location } from 'knifecycle';
import { type LogService, type TimeService, noop } from 'common-services';

export type ClockMockService =
  | {
      mockedTime: number;
      isFixed: true;
    }
  | {
      referenceTime: number;
      mockedTime: number;
      isFixed: false;
    };
export type TimeMockService = TimeService;
export type TimeMockConfig = {
  CLOCK_MOCK?: ClockMockService;
};
export type TimeMockDependencies = Required<TimeMockConfig> & {
  time?: TimeService;
  log?: LogService;
};

/* Architecture Note #1.7: Time mock

The `timeMock` service allows developers to mock the time
 of the application by injecting it instead of the `time`
 service provided by the `common-services` module.
*/

export default location(singleton(autoService(initTimeMock)), import.meta.url);

/**
 * Instantiate the time mock service
 * @name initTimeMock
 * @function
 * @param  {Object}   services               The services to inject
 * @param  {Object}   services.CLOCK_MOCK    An object to store the time mock state
 * @param  {Object}   [services.time = noop] A time function
 * @param  {Object}   [services.log = noop]  A logging function
 * @return {Promise<Function>}               A promise of the time function
 * @example
 * import {
 *   DEFAULT_LOGGER,
 *   initLog,
 * } from 'common-services';
 * import {
 *   initTimeMock,
 * } from 'application-services';
 *
 * const CLOCK_MOCK = {
 *   referenceTime: Date.now(),
 *   mockedTime: Date.parse('2012-12-20T20:20:20Z'),
 *   isFixed: false,
 * };
 * const log = await initLog({
 *   logger: DEFAULT_LOGGER,
 * });
 *
 * const time = await initTimeMock({
 *   log,
 * });
 */
async function initTimeMock({
  CLOCK_MOCK,
  time = Date.now,
  log = noop,
}: TimeMockDependencies): Promise<TimeService> {
  log('warning', `⏳ - Time mock is enabled!`);

  const timeMock = () => {
    const currentTime =
      CLOCK_MOCK.mockedTime +
      (CLOCK_MOCK.isFixed ? 0 : time() - CLOCK_MOCK.referenceTime);

    log('debug', '⏰ - Picked a mocked timestamp:', currentTime);

    return currentTime;
  };

  return timeMock;
}
