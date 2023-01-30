import { YError } from 'yerror';

/**
 * Cast any string into an application environment
 * @param appEnv string
 * @param availableAppEnvs string[]
 * @returns string
 */
export function extractAppEnv<T extends string = 'local'>(
  appEnv = 'local',
  availableAppEnvs: T[],
): T {
  if ((availableAppEnvs as string[]).includes(appEnv)) {
    return appEnv as T;
  }
  throw new YError('E_BAD_APP_ENV', appEnv, availableAppEnvs);
}
