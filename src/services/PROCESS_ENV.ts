import { constant } from 'knifecycle';

/* Architecture Note #1.1: `PROCESS_ENV`

A simple constant service to enclose the NodeJS `process.env`
 global variable.
*/
export default constant('PROCESS_ENV', process.env);
