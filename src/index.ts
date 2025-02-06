/* Architecture Note #1: Application services

This module manage application environments and configurations
 out of the box thanks to two separated environment variables:
 the classic `ENV.NODE_ENV` and the `APP_ENV`.

The `ENV.NODE_ENV` variable is intended to simply tell all
 tooling ecosystem in which context the code is run.

The `APP_ENV` is instead aimed to tell in which deployment
 environment the application is run (to load specific
 configurations like the databases endpoints of each
 deployment environments).

The `ENV` service can be customized by overriding
 the `AppEnvVars` type in your own project. The
 same goes for the `APP_CONFIG` service and the
 `AppConfig` type.

To do so, create an `app.d.ts` in your root source
 folder.
```ts
import type {
  BaseAppConfig,
  BaseAppEnvVars,
} from 'application-services';
import type { DBConfig } from './services/db.js';

declare module 'application-services' {
  export interface AppEnvVars extends BaseAppEnvVars {
    ANY_ENV_VAR_YOU_WISH: string;
  }

  // Overriding with your application configurations
  export interface AppConfig
    extends BaseAppConfig,
    DBConfig {
      anyConfigPropYouWish: string;
    }
}
```
*/

import initProcess from './services/process.js';
import initProcessEnv from './services/PROCESS_ENV.js';
import initProjectDir from './services/PROJECT_DIR.js';
import initEnv, { NodeEnv } from './services/ENV.js';
import initAppConfig from './services/APP_CONFIG.js';
import initTimeMock from './services/timeMock.js';
import { extractAppEnv } from './libs/env.js';

export type {
  ProcessService,
  ProcessServiceConfig,
  ProcessServiceDependencies,
} from './services/process.js';
export type {
  BaseAppEnvVars,
  AppEnvVars,
  ProcessEnvConfig,
  ProcessEnvDependencies,
} from './services/ENV.js';
export type {
  BaseAppConfig,
  AppConfig,
  AppConfigDependencies,
} from './services/APP_CONFIG.js';
export type {
  ProjectDirService,
  ProjectDirDependencies,
} from './services/PROJECT_DIR.js';
export type {
  TimeMockService,
  TimeMockConfig,
  TimeMockDependencies,
  ClockMockService,
} from './services/timeMock.js';

export {
  NodeEnv,
  initProcess,
  initProcessEnv,
  initProjectDir,
  initEnv,
  initAppConfig,
  initTimeMock,
  extractAppEnv,
};
