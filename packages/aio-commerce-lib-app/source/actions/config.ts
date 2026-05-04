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
  filterBusinessConfigSchemaByFlavor,
  getConfiguration,
  initialize,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";
import { ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import { validateCommerceAppConfigDomain } from "#config/index";

import type {
  BusinessConfigSchema,
  ConfigValue,
} from "@adobe/aio-commerce-lib-config";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";

/** The arguments for the config action factory. */
type ConfigActionFactoryArgs = {
  configSchema: BusinessConfigSchema;
};

/** The parameters for the config action. */
type ConfigActionParams = RuntimeActionParams &
  ConfigActionFactoryArgs & {
    AIO_COMMERCE_CONFIG_ENCRYPTION_KEY?: string;
    AIO_COMMERCE_API_FLAVOR?: unknown;
    commerceEnv?: unknown;
  };

/** The context for the config action. */
interface ConfigActionContext extends BaseContext {
  rawParams: ConfigActionParams;
}

// Placeholder value for password fields.
const MASKED_PASSWORD_VALUE = "*****";

/** Normalizes a possible flavor value to a supported Commerce flavor. */
function normalizeCommerceFlavor(value: unknown): "paas" | "saas" | undefined {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "paas" || normalized === "saas") {
    return normalized;
  }

  return;
}

/**
 * Filters password fields from the configuration values.
 * @param schema - The schema to use to filter the values.
 * @param values - The values to filter.
 * @returns The filtered values.
 */
function filterPasswordFields<T extends Omit<ConfigValue, "origin">>(
  schema: BusinessConfigSchema,
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

// The router that will hold the config routes
const router = new HttpActionRouter<ConfigActionContext>().use(logger());

/** GET / - Retrieve configuration */
router.get("/", {
  query: v.object({
    scopeId: nonEmptyStringValueSchema("scopeId"),
    commerceEnv: v.optional(v.picklist(["paas", "saas"] as const)),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const configSchema = rawParams.configSchema;

    logger.debug("Validating configuration schema...");
    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );

    const flavor =
      req.query.commerceEnv ??
      normalizeCommerceFlavor(rawParams.commerceEnv) ??
      normalizeCommerceFlavor(rawParams.AIO_COMMERCE_API_FLAVOR);

    const filteredSchema = flavor
      ? filterBusinessConfigSchemaByFlavor(validatedSchema, flavor)
      : validatedSchema;

    initialize({ schema: filteredSchema });

    const { scopeId } = req.query;
    logger.debug(`Retrieving configuration with scope id: ${scopeId}`);
    const appConfiguration = await getConfiguration(byScopeId(scopeId), {
      encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
    });

    logger.debug("Masking password values...");
    appConfiguration.config = filterPasswordFields(
      filteredSchema,
      appConfiguration.config,
    );

    return ok({
      body: { schema: filteredSchema, values: appConfiguration },
    });
  },
});

/**
 * PUT / - Set configuration (deprecated)
 * @deprecated Use PATCH instead. This endpoint overwrites all values for the scope
 * and does not support partial updates or unset semantics.
 */
router.put("/", {
  body: v.object({
    scopeId: nonEmptyStringValueSchema("scopeId"),
    config: v.array(
      v.object({
        name: nonEmptyStringValueSchema("config.name"),
        value: v.union([v.string(), v.array(v.string())]),
      }),
    ),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const { configSchema } = rawParams;

    logger.debug(`Setting configuration with scope id: ${req.body.scopeId}`);
    const { scopeId, config } = req.body;

    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );
    initialize({ schema: validatedSchema });

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
  body: v.object({
    scopeId: nonEmptyStringValueSchema("scopeId"),
    config: v.array(
      v.object({
        name: nonEmptyStringValueSchema("config.name"),
        // null unsets the field, restoring inheritance from the parent scope
        value: v.nullable(
          v.union([v.boolean(), v.string(), v.array(v.string())]),
        ),
      }),
    ),
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const { configSchema } = rawParams;

    logger.debug(`Patching configuration with scope id: ${req.body.scopeId}`);
    const { scopeId, config } = req.body;

    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );
    initialize({ schema: validatedSchema });

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

/** Factory to create the route handler for the `config` action. */
export const configRuntimeAction =
  ({ configSchema }: ConfigActionFactoryArgs) =>
  async (params: RuntimeActionParams) => {
    const handler = router.handler();
    return await handler({
      ...params,
      configSchema,
    });
  };
