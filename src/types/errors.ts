/**
 * Error registry for application-services
 *
 * This registry defines all error codes used in the application-services library,
 * providing type safety and documentation for error handling.
 */
declare module 'yerror' {
  interface YErrorRegistry {
    /**
     * Thrown when an invalid application environment is provided.
     */
    E_BAD_APP_ENV: [
      providedAppEnv: string,
      availableAppEnvs: readonly string[],
    ];

    /**
     * Thrown when NODE_ENV contains a non-standard value.
     */
    E_BAD_NODE_ENV: [nodeEnv: string, validNodeEnvs: readonly string[]];

    /**
     * Thrown when an attempt is made to change NODE_ENV via environment files.
     */
    E_BAD_ENV: [currentNodeEnv: string, expectedNodeEnv: string];

    /**
     * Thrown when the configuration file cannot be loaded.
     */
    E_NO_CONFIG: [configPath: string];

    /**
     * Thrown when the project directory cannot be found.
     */
    E_NO_PROJECT_DIR: [];
  }
}
