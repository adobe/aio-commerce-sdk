/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Types for `@adobe/aio-lib-ims`, can be removed once the library is published with types.
 * @see https://github.com/adobe/aio-lib-ims/blob/86698a983d893b8f33d39dd32a61b165f3f6018c/types/index.d.ts
 */
declare module '@adobe/aio-lib-ims' {
  export let context: ConfigCliContext | StateActionContext;
  export function getToken(contextName: string, options: object): Promise<string>;

  /**
   * The `ConfigCliContext` class stores IMS `contexts` for the Adobe I/O CLI in the local file
   * system using the Adobe I/O Core Configuration Library.
   */
  export class ConfigCliContext extends Context {
    /** @private */
    private aioConfig;
    /**
     * Gets the cli context data
     *
     * @returns {Promise<any>} the cli context data
     */
    getCli(): Promise<any>;
    /**
     * Sets the cli context data
     *
     * @param {object} contextData the data to save
     * @param {boolean} [local=false] set to true to save to local config, false for global config
     * @param {boolean} [merge=true] set to true to merge existing data with the new data
     */
    setCli(contextData: object, local?: boolean, merge?: boolean): Promise<void>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override getContextValue(key: any): Promise<{
      data: any;
      local: boolean;
    }>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override getConfigValue(key: any): Promise<any>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override setContextValue(key: any, value: any, isLocal: any): Promise<void>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override setConfigValue(key: any, value: any, isLocal: any): Promise<void>;
    /** @private */
    private getContextValueFromOptionalSource;
  }

  /**
   * The `StateActionContext` class stores IMS `contexts` for Adobe I/O Runtime Actions in the
   * cloud using the Adobe I/O State Library.
   */
  export class StateActionContext extends Context {
    /** @private */
    private data;
    /** @private */
    private tokensLoaded;
    /** @private */
    private state;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override getContextValue(key: any): Promise<{
      data: any;
      local: boolean;
    }>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override getConfigValue(key: any): Promise<any>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override setContextValue(key: any, value: any, isLocal: any): Promise<void>;
    /**
     * @protected
     * @override
     * @ignore
     */
    protected override setConfigValue(key: any, value: any): Promise<void>;
    /** @private */
    private loadTokensOnce;
    /** @private */
    private hasToken;
    /** @private */
    private getStateKey;
    /** @private */
    private initStateOnce;
    /** @private */
    private deleteTokens;
    /** @private */
    private setTokens;
  }

  /**
   * The `Context` abstract class provides an interface to manage the IMS configuration contexts on behalf of
   * the Adobe I/O Lib IMS Library.
   */
  export class Context {
    constructor(keyNames: any);
    keyNames: any;
    /**
     * Gets the current context name.
     *
     * @returns {Promise<string>} the current context name
     */
    getCurrent(): Promise<string>;
    /**
     * Sets the current context name in the local configuration
     *
     * @param {string} contextName The name of the context to use as the current context
     * @returns {Promise<any>} returns an instance of the Config object
     */
    setCurrent(contextName: string): Promise<any>;
    /**
     * Returns an object representing the named context.
     * If the contextName parameter is empty or missing, it defaults to the
     * current context name. The result is an object with two properties:
     *
     *   - `name`: The actual context name used
     *   - `data`: The IMS context data
     *   - `local`: Whether the context data is stored locally or not
     *
     * @param {string} contextName Name of the context information to return.
     * @returns {Promise<object>} The configuration object
     */
    get(contextName: string): Promise<object>;
    /**
     * Updates the named configuration with new configuration data. If a configuration
     * object for the named context already exists it is completely replaced with this new
     * configuration.
     *
     * @param {string} contextName Name of the context to update
     * @param {object} contextData The configuration data to store for the context
     * @param {boolean} local Persist in local or global configuration. When running in
     *      Adobe I/O Runtime, this has no effect unless `contextData` contains an
     *      `access_token` or `refresh_token` field, in which case setting `local=true` will
     *      prevent the persistence of those fields in the [`State
     *      SDK`](https://github.com/adobe/aio-lib-state). Please note that when calling
     *      `getToken` in an I/O Runtime Action, generated tokens will always be persisted
     *      as `getToken` internally calls `context.set` with `local=false`.
     */
    set(contextName: string, contextData: object, local?: boolean): Promise<void>;
    /**
     * Returns the names of the configured contexts as an array of strings.
     *
     * @returns {Promise<string[]>} The names of the currently known configurations.
     */
    keys(): Promise<string[]>;
    /**
     *
     * @param {string} configName config name
     * @returns {Promise<any>} config value
     * @protected
     * @ignore
     */
    protected getConfigValue(configName: string): Promise<any>;
    /**
     * @param {string} configName config name
     * @param {any} configValue config value
     * @param {boolean} isLocal write local or not
     * @protected
     * @ignore
     */
    protected setConfigValue(configName: string, configValue: any, isLocal: boolean): Promise<void>;
    /**
     * @param {string} contextName context name
     * @returns {Promise<{data: any, local: boolean}>} context value
     * @protected
     * @ignore
     */
    protected getContextValue(contextName: string): Promise<{
      data: any;
      local: boolean;
    }>;
    /**
     * @param {string} contextName config name
     * @param {any} ctxValue config value
     * @param {boolean} isLocal write local or not
     * @protected
     * @ignore
     */
    protected setContextValue(contextName: string, ctxValue: any, isLocal: boolean): Promise<void>;
    /**
     * @ignore
     * @protected
     * @returns {Promise<string[]>} return defined contexts
     */
    protected contextKeys(): Promise<string[]>;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
