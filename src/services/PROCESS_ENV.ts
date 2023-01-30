import { constant } from 'knifecycle';

/* Architecture Note #1.1: `PROCESS_ENV`

A simple constant service to enclose the NodeJS `process.env`
 global variable.
*/

/**
 * @constant
 * @type Object
 * @name PROCESS_ENV
 * Provides the PROCESS_ENV service
 */
const PROCESS_ENV = process.env;

export default constant('PROCESS_ENV', PROCESS_ENV);
