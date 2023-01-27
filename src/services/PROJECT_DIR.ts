import { packageDirectory } from 'pkg-dir';
import { name, autoService } from 'knifecycle';
import { YError } from 'yerror';
import type { LogService } from 'common-services';

/* Architecture Note #1.2: `PROJECT_DIR`

A service to determine the directory of the NodeJS project
 currently running.
*/
async function initProjectDirectory({ log }: { log: LogService }) {
  const theProjectDirectory = await packageDirectory();

  if (theProjectDirectory) {
    log('debug', '💡 - Found the project dir:', theProjectDirectory);
    return theProjectDirectory;
  }

  log(
    'error',
    '❌ - Could not find project directory, are you sure you run the script inside a Node project?',
  );
  throw new YError('E_NO_PROJECT_DIR');
}

export default name('PROJECT_DIR', autoService(initProjectDirectory));
