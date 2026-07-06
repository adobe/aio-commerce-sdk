/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  byScopeId,
  getConfiguration,
  initialize,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";
import { ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";

import { filterSchemaByEnv } from "#config/lib/environment";

import {
  GetConfigurationQuerySchema,
  PatchConfigBodySchema,
  PutConfigBodySchema,
} from "./schema";

import type {
  BusinessConfigSchema,
  ConfigValue,
  ResolvedBusinessConfigSchema,
} from "@adobe/aio-commerce-lib-config";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";

/** The arguments required to create the runtime action for the config action. */
export type ConfigActionFactoryArgs = {
  configSchema: BusinessConfigSchema;
};

/** The parameters for the config action. */
type ConfigActionParams = RuntimeActionParams &
  ConfigActionFactoryArgs & {
    AIO_COMMERCE_CONFIG_ENCRYPTION_KEY?: string;
  };

/** The context for the config action. */
interface ConfigActionContext extends BaseContext {
  rawParams: ConfigActionParams;
}

// Placeholder value for password fields.
const MASKED_PASSWORD_VALUE = "*****";

/**
 * Filters password fields from the configuration values.
 *
 * @param schema - The schema to use to filter the values.
 * @param values - The values to filter.
 */
function filterPasswordFields<T extends Omit<ConfigValue, "origin">>(
  schema: ResolvedBusinessConfigSchema,
  values: T[],
) {
  return values.map((item) => {
    const schemaMatch = schema.find((field) => field.name === item.name);
    if (schemaMatch?.type === "password") {
      return { ...item, value: MASKED_PASSWORD_VALUE };
    }

    return item;
  });
}

/**
 * Config action router.
 *
 * Routes:
 * - GET /     Get current configuration values for a given scope
 * - POST /    Set configuration (overrides all values for the scope) (deprecated)
 * - PATCH /   Partially update configuration (only updates provided fields, allows unsetting)
 */
export const router = new HttpActionRouter<ConfigActionContext>().use(
  logger({
    name: () => "config",
  }),
);

/** GET / - Retrieve configuration */
router.get("/", {
  handler: async (req, ctx) => {
    const { logger: requestLogger, rawParams } = ctx;
    const { configSchema: rawConfigSchema } = rawParams;

    const env = req.query.commerceEnv;
    const envFilteredSchema = env
      ? filterSchemaByEnv(rawConfigSchema, env)
      : rawConfigSchema;

    requestLogger.debug("Initializing configuration");
    const { configSchema } = await initialize({
      params: rawParams,
      schema: envFilteredSchema,
    });

    const { scopeId } = req.query;
    requestLogger.debug(`Retrieving configuration with scope id: ${scopeId}`);
    const appConfiguration = await getConfiguration(byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    requestLogger.debug("Masking password values...");
    appConfiguration.config = filterPasswordFields(
      configSchema,
      appConfiguration.config,
    );

    return ok({
      body: { schema: configSchema, values: appConfiguration },
    });
  },
  query: GetConfigurationQuerySchema,
});

/**
 * PUT / - Set configuration (deprecated)
 *
 * @deprecated Use PATCH instead. This endpoint overwrites all values for the scope
 * and does not support partial updates or unset semantics.
 */
router.put("/", {
  body: PutConfigBodySchema,
  handler: async (req, ctx) => {
    const { logger: requestLogger, rawParams } = ctx;

    requestLogger.debug(
      `Setting configuration with scope id: ${req.body.scopeId}`,
    );
    const { scopeId, config } = req.body;

    const { configSchema } = await initialize({
      params: rawParams,
      schema: rawParams.configSchema,
    });

    // The UI sent it to us as a masked value, which means the user didn't update it.
    const updatedFields = config.filter(
      (item) => item.value !== MASKED_PASSWORD_VALUE,
    );

    const result = await setConfiguration(
      { config: updatedFields },
      byScopeId(scopeId),
      {
        encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
      },
    );

    result.config = filterPasswordFields(configSchema, result.config);
    return ok({
      body: result,
      headers: {
        "Cache-Control": "no-store",
        Deprecation: "Wed, 15 Apr 2026 00:00:00 GMT",
      },
    });
  },
});

/** PATCH / - Partially update configuration */
router.patch("/", {
  body: PatchConfigBodySchema,
  handler: async (req, ctx) => {
    const { logger: requestLogger, rawParams } = ctx;

    requestLogger.debug(
      `Patching configuration with scope id: ${req.body.scopeId}`,
    );
    const { scopeId, config } = req.body;

    const { configSchema } = await initialize({
      params: rawParams,
      schema: rawParams.configSchema,
    });

    const result = await setConfiguration({ config }, byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    result.config = filterPasswordFields(configSchema, result.config);
    return ok({
      body: result,
      headers: { "Cache-Control": "no-store" },
    });
  },
});
