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
  getConfigurationVersions,
  initialize,
  restoreConfigurationVersion,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";
import {
  badRequest,
  conflict,
  notFound,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import { SDK_LIB_VERSIONS_HEADERS } from "#actions/version";
import { filterSchemaByEnv } from "#config/lib/environment";

import {
  GetConfigurationQuerySchema,
  GetConfigurationVersionsQuerySchema,
  PatchConfigBodySchema,
  RestoreConfigurationVersionBodySchema,
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
 * - PATCH /   Partially update configuration (only updates provided fields, allows unsetting)
 * - GET /versions   List configuration history
 * - POST /versions/restore   Reapply selected historical changes
 */
export const router = new HttpActionRouter<ConfigActionContext>({
  headers: SDK_LIB_VERSIONS_HEADERS,
}).use(
  withLogger({
    name: () => "config",
  }),
);

/** GET / - Retrieve configuration */
router.get("/", {
  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const { configSchema: rawConfigSchema } = rawParams;

    const env = req.query.commerceEnv;
    const envFilteredSchema = env
      ? filterSchemaByEnv(rawConfigSchema, env)
      : rawConfigSchema;

    logger.debug("Initializing configuration");
    const { configSchema } = await initialize({
      params: rawParams,
      schema: envFilteredSchema,
    });

    const { scopeId } = req.query;
    logger.debug(`Retrieving configuration with scope id: ${scopeId}`);
    const appConfiguration = await getConfiguration(byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    logger.debug("Masking password values...");
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

/** PATCH / - Partially update configuration */
router.patch("/", {
  body: PatchConfigBodySchema,
  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;

    logger.debug(`Patching configuration with scope id: ${req.body.scopeId}`);
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

/** Maps expected versioning failures to client errors; storage failures remain server errors. */
function versionErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message.startsWith("VERSION_NOT_FOUND:")) {
      return notFound({
        body: {
          code: "VERSION_NOT_FOUND",
          message: "Version not found for the selected scope",
        },
      });
    }
    if (error.message.startsWith("VERSION_CONFLICT:")) {
      return conflict({
        body: {
          code: "VERSION_CONFLICT",
          message: "The latest version does not match expectedLatestVersionId",
        },
      });
    }
    if (
      error.message.startsWith("INVALID_PARAMS:") ||
      error.message.startsWith("INVALID_SCOPE_ID:") ||
      error.message.startsWith("INVALID_SCOPE:")
    ) {
      return badRequest({
        body: { code: error.message.split(":").at(0), message: error.message },
      });
    }
  }
  throw error;
}

/** GET /versions - Retrieve masked, scope-local history. */
router.get("/versions", {
  handler: async (req, ctx) => {
    const { rawParams } = ctx;
    await initialize({ params: rawParams, schema: rawParams.configSchema });
    try {
      const { scopeId, limit, offset } = req.query;
      const result = await getConfigurationVersions(byScopeId(scopeId), {
        limit,
        offset,
      });
      return ok({ body: result, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return versionErrorResponse(error);
    }
  },
  query: GetConfigurationVersionsQuerySchema,
});

/** POST /versions/restore - Restore selected fields without overwriting other overrides. */
router.post("/versions/restore", {
  body: RestoreConfigurationVersionBodySchema,
  handler: async (req, ctx) => {
    const { rawParams } = ctx;
    const { configSchema } = await initialize({
      params: rawParams,
      schema: rawParams.configSchema,
    });
    try {
      const { scopeId, ...request } = req.body;
      const result = await restoreConfigurationVersion(
        byScopeId(scopeId),
        request,
        {
          encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
        },
      );
      result.config = filterPasswordFields(configSchema, result.config);
      return ok({ body: result, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return versionErrorResponse(error);
    }
  },
});
