import { service } from 'knifecycle';
import { env } from 'node:process';
import type { AppEnvVars } from './ENV.js';

/* Architecture Note #1.1: `PROCESS_ENV`

A simple service to enclose the NodeJS `process.env`
 global variable. It is provided as a service to avoid
 the process environment to be saved into builds.
*/

/**
 * @constant
 * @type Object
 * @name PROCESS_ENV
 * Provides the PROCESS_ENV service
 */
async function initProcessEnv(): Promise<AppEnvVars> {
  return env as AppEnvVars;
}

export default service(initProcessEnv, 'PROCESS_ENV', [], true);
