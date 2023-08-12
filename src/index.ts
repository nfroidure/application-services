/* Architecture Note #1: Application services

This module manage application environments and configurations
 out of the box thanks to two separated environment variables:
 the classic `NODE_ENV` and the `APP_ENV`.

The `NODE_ENV` variable is intended to simply tell all
 tooling ecosystem in which context the code is run.

The `APP_ENV` is instead aimed to tell in which deployment
 environment the application is run (to load specific
 configurations like the databases endpoints of each
 deployment environments).

The `APP_ENV` values can be customized by overriding
 the AppEnv type in your own project:
```sh
cat "
import type {
  BaseAppEnv,
  BaseAppConfig,
  BaseAppEnvVars,
} from 'application-services';
import { DBConfig } from './services/db.js';

declare module 'application-services' {
  export interface AppEnvVars extends BaseAppEnvVars {
    DRY_RUN: string;
  }

  // Overriding with your application configurations
  export interface AppConfig
    extends BaseAppConfig,
    DBConfig {
      anyConfigPropYouWish: string;
    }
}
" > app.d.ts
```
*/

import initProcessEnvService from './services/PROCESS_ENV.js';
import initProjectDirService from './services/PROJECT_DIR.js';
import initEnvService from './services/ENV.js';
import initAppConfigService from './services/APP_CONFIG.js';
import { extractAppEnv } from './libs/env.js';

export type {
  BaseAppEnvVars,
  AppEnvVars,
  ENVConfig,
  ENVDependencies,
} from './services/ENV.js';
export type { BaseAppConfig, AppConfig } from './services/APP_CONFIG.js';

export {
  initProcessEnvService,
  initProjectDirService,
  initEnvService,
  initAppConfigService,
  extractAppEnv,
};
