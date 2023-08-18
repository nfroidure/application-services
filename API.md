# API
## Constants

<dl>
<dt><a href="#PROCESS_ENV
Provides the PROCESS_ENV service">PROCESS_ENV
Provides the PROCESS_ENV service</a> : <code>Object</code></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#extractAppEnv">extractAppEnv(appEnv, availableAppEnvs)</a> ⇒</dt>
<dd><p>Cast any string into an application environment</p>
</dd>
<dt><a href="#initAppConfig">initAppConfig(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the APP_CONFIG service according to the APP_ENV</p>
</dd>
<dt><a href="#initENV">initENV(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the ENV service using process env plus dotenv files
 loaded in <code>.env.node.${ENV.NODE_ENV}</code> and <code>.env.app.${APP_ENV}</code>.</p>
</dd>
<dt><a href="#initProcess">initProcess(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Instantiate the process service</p>
</dd>
<dt><a href="#initProjectDirectory">initProjectDirectory(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the PROJECT_DIR service</p>
</dd>
</dl>

<a name="PROCESS_ENV
Provides the PROCESS_ENV service"></a>

## PROCESS\_ENV
Provides the PROCESS\_ENV service : <code>Object</code>
**Kind**: global constant  
<a name="extractAppEnv"></a>

## extractAppEnv(appEnv, availableAppEnvs) ⇒
Cast any string into an application environment

**Kind**: global function  
**Returns**: string  

| Param | Description |
| --- | --- |
| appEnv | string |
| availableAppEnvs | string[] |

<a name="initAppConfig"></a>

## initAppConfig(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the APP_CONFIG service according to the APP_ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a an object the actual configuration properties.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `APP_CONFIG` depends on |
| services.APP_ENV | <code>Object</code> |  | The injected `APP_ENV` value |
| services.PROJECT_SRC | <code>Object</code> |  | The project source directory |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initENV"></a>

## initENV(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the ENV service using process env plus dotenv files
 loaded in `.env.node.${ENV.NODE_ENV}` and `.env.app.${APP_ENV}`.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the actual env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `ENV` depends on |
| [services.BASE_ENV] | <code>Object</code> |  | Base env vars that will be added to the environment |
| services.APP_ENV | <code>Object</code> |  | The injected `APP_ENV` value |
| services.PROCESS_ENV | <code>Object</code> |  | The injected `process.env` value |
| services.PROJECT_DIR | <code>Object</code> |  | The NodeJS project directory |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initProcess"></a>

## initProcess(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Instantiate the process service

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of the process object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `process` depends on |
| services.APP_ENV | <code>Object</code> |  | The injected `APP_ENV` value |
| [services.PROCESS_NAME] | <code>Object</code> |  | The process name to display |
| [services.SIGNALS] | <code>Object</code> |  | The process signals that interrupt the process |
| [services.exit] | <code>Object</code> |  | A `process.exit` like function |
| services.$instance | <code>Object</code> |  | The Knifecycle instance |
| services.$fatalError | <code>Object</code> |  | The Knifecycle fatal error manager |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initProjectDirectory"></a>

## initProjectDirectory(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the PROJECT_DIR service

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a an object the actual configuration properties.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services PROJECT_DIR depends on |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

