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
  byCode,
  byCodeAndLevel,
  byScopeId,
  getConfiguration,
  getConfigurationVersions,
  initialize,
  restoreConfigurationVersion,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";
import { badRequest, ok } from "@adobe/aio-commerce-lib-core/responses";
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
    AIO_COMMERCE_CONFIG_AUDIT_ENABLED?: string | boolean;
  };

/** The context for the config action. */
interface ConfigActionContext extends BaseContext {
  rawParams: ConfigActionParams;
}

// Placeholder value for password fields.
const MASKED_PASSWORD_VALUE = "*****";

function parseAuditEnabled(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return true;
}

function parseNonNegativeInteger(
  value: string | number | undefined,
  name: "limit" | "offset",
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`INVALID_PARAMS: ${name} must be a non-negative integer`);
  }
  return parsed;
}

function resolveScopeSelector(
  input: {
    scopeId?: string;
    id?: string;
    code?: string;
    level?: string;
  },
  allowCodeOnly: boolean,
) {
  const scopeId = input.scopeId ?? input.id;
  if (scopeId) {
    return byScopeId(scopeId);
  }
  if (input.code && input.level) {
    return byCodeAndLevel(input.code, input.level);
  }
  if (allowCodeOnly && input.code) {
    return byCode(input.code);
  }
  return null;
}

type ScopeSelector = NonNullable<ReturnType<typeof resolveScopeSelector>>;
type BadRequestResponse = ReturnType<typeof badRequest>;

function auditDisabledResponse() {
  return badRequest({
    body: {
      code: "AUDIT_DISABLED",
      message: "Audit feature is disabled",
    },
  });
}

function resolveAuditOrBadRequest(rawParams: ConfigActionParams) {
  const auditEnabled = parseAuditEnabled(
    rawParams.AIO_COMMERCE_CONFIG_AUDIT_ENABLED,
  );
  if (!auditEnabled) {
    return {
      ok: false,
      response: auditDisabledResponse(),
    } satisfies { ok: false; response: BadRequestResponse };
  }
  return {
    ok: true,
    auditEnabled,
  } satisfies { ok: true; auditEnabled: boolean };
}

function resolveSelectorOrBadRequest(
  input: {
    scopeId?: string;
    id?: string;
    code?: string;
    level?: string;
  },
  allowCodeOnly: boolean,
  invalidSelectorMessage: string,
) {
  const selector = resolveScopeSelector(input, allowCodeOnly);
  if (!selector) {
    return {
      ok: false,
      response: badRequest({
        body: {
          code: "INVALID_PARAMS",
          message: invalidSelectorMessage,
        },
      }),
    } satisfies { ok: false; response: BadRequestResponse };
  }

  return {
    ok: true,
    selector,
  } satisfies { ok: true; selector: ScopeSelector };
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
  }),

  handler: async (req, ctx) => {
    const { logger, rawParams } = ctx;
    const configSchema = rawParams.configSchema;

    logger.debug("Validating configuration schema...");
    const validatedSchema = validateCommerceAppConfigDomain(
      configSchema,
      "businessConfig.schema",
    );

    initialize({ schema: validatedSchema });

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
      body: { schema: validatedSchema, values: appConfiguration },
    });
  },
});

/** POST / - Set configuration */
router.post("/", {
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
    const auditEnabled = parseAuditEnabled(
      rawParams.AIO_COMMERCE_CONFIG_AUDIT_ENABLED,
    );

    logger.debug(`Setting configuration with scope id: ${req.body.scopeId}`);
    const { scopeId, config } = req.body;

    // The UI sent it to us as a masked value, which means the user didn't update it.
    const updatedFields = config.filter(
      (item) => item.value !== MASKED_PASSWORD_VALUE,
    );

    const result = await setConfiguration(
      { config: updatedFields },
      byScopeId(scopeId),
      {
        encryptionKey: rawParams.AIO_COMMERCE_CONFIG_ENCRYPTION_KEY,
        auditEnabled,
      },
    );

    result.config = filterPasswordFields(configSchema, result.config);
    return ok({
      body: result,
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** GET /versions - List configuration versions */
router.get("/versions", {
  query: v.object({
    scopeId: v.optional(nonEmptyStringValueSchema("scopeId")),
    id: v.optional(nonEmptyStringValueSchema("id")),
    code: v.optional(nonEmptyStringValueSchema("code")),
    level: v.optional(nonEmptyStringValueSchema("level")),
    limit: v.optional(v.union([v.string(), v.number()])),
    offset: v.optional(v.union([v.string(), v.number()])),
  }),

  handler: async (req, ctx) => {
    const { rawParams } = ctx;
    const auditResult = resolveAuditOrBadRequest(rawParams);
    if (!auditResult.ok) {
      return auditResult.response;
    }

    const selectorResult = resolveSelectorOrBadRequest(
      req.query,
      true,
      "Either scopeId/id or code query param is required",
    );
    if (!selectorResult.ok) {
      return selectorResult.response;
    }

    const { auditEnabled } = auditResult;
    const { selector } = selectorResult;

    try {
      const limit = parseNonNegativeInteger(req.query.limit, "limit");
      const offset = parseNonNegativeInteger(req.query.offset, "offset");
      const result = await getConfigurationVersions(
        selector,
        { limit, offset },
        { auditEnabled },
      );

      return ok({
        body: result,
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("INVALID_PARAMS:")
      ) {
        return badRequest({
          body: {
            code: "INVALID_PARAMS",
            message: "limit and offset must be non-negative integers",
          },
        });
      }
      throw error;
    }
  },
});

/** POST /versions/restore - Restore a configuration version */
router.post("/versions/restore", {
  body: v.object({
    scopeId: v.optional(nonEmptyStringValueSchema("scopeId")),
    id: v.optional(nonEmptyStringValueSchema("id")),
    code: v.optional(nonEmptyStringValueSchema("code")),
    level: v.optional(nonEmptyStringValueSchema("level")),
    versionId: nonEmptyStringValueSchema("versionId"),
    expectedLatestVersionId: v.optional(
      nonEmptyStringValueSchema("expectedLatestVersionId"),
    ),
  }),

  handler: async (req, ctx) => {
    const { rawParams } = ctx;
    const auditResult = resolveAuditOrBadRequest(rawParams);
    if (!auditResult.ok) {
      return auditResult.response;
    }

    const selectorResult = resolveSelectorOrBadRequest(
      req.body,
      false,
      "Either scopeId/id or both code and level are required for restore",
    );
    if (!selectorResult.ok) {
      return selectorResult.response;
    }

    const { auditEnabled } = auditResult;
    const { selector } = selectorResult;

    try {
      const result = await restoreConfigurationVersion(
        selector,
        {
          versionId: req.body.versionId,
          expectedLatestVersionId: req.body.expectedLatestVersionId,
        },
        { auditEnabled },
      );

      return ok({
        body: result,
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("VERSION_NOT_FOUND") ||
          error.message.includes("VERSION_CONFLICT"))
      ) {
        return badRequest({
          body: {
            code: "INVALID_REQUEST",
            message: error.message,
          },
        });
      }
      throw error;
    }
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
