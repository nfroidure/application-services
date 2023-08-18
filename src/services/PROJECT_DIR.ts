import { packageDirectory } from 'pkg-dir';
import { name, autoService, singleton } from 'knifecycle';
import { YError } from 'yerror';
import { noop } from '../libs/utils.js';
import type { LogService } from 'common-services';

/* Architecture Note #1.2: `PROJECT_DIR`

A service to determine the directory of the NodeJS project
 currently running.
*/

export type ProjectDirService = string;
export type ProjectDirDependencies = {
  log: LogService;
};

/**
 * Initialize the PROJECT_DIR service
 * @param  {Object}   services
 * The services PROJECT_DIR depends on
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
async function initProjectDirectory({
  log = noop,
}: ProjectDirDependencies): Promise<ProjectDirService> {
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

export default singleton(
  name('PROJECT_DIR', autoService(initProjectDirectory)),
);
