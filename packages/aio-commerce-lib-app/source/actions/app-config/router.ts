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

import { resolveBusinessConfigSchema } from "@adobe/aio-commerce-lib-config";
import { CommerceEnvSchema } from "@adobe/aio-commerce-lib-core/commerce";
import {
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import * as v from "valibot";

import { filterAppConfigByEnv } from "#config/lib/environment";
import { validateCommerceAppConfig } from "#config/lib/validate";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";
import { getConfigDomains } from "#config/schema/domains";

import { buildOpenApiSpec, getOpenApiCacheKey, getServerUrl } from "./openapi";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { CommerceAppConfig } from "#config/schema/app";

/** The arguments required to create the runtime action for the app-config action. */
export type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfig;
};

/** The params received by all handlers. */
type RuntimeActionArgs = RuntimeActionParams & RuntimeActionFactoryArgs;

/** The context for the app-config action. */
interface AppConfigActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

/**
 * App Config action router.
 *
 * Routes:
 * - GET /               Retrieve the Commerce App configuration.
 * - GET /openapi.json   Returns the OpenAPI spec for all SDK actions
 */
export const router = new HttpActionRouter<AppConfigActionContext>().use(
  logger({ name: () => "app-config" }),
);

/** GET / - Get app config */
router.get("/", {
  query: v.object({ commerceEnv: v.optional(CommerceEnvSchema) }),
  handler: async (req, { logger, rawParams }) => {
    const rawAppConfig = rawParams.appConfig;

    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    let appConfig = rawAppConfig;
    if (hasBusinessConfigSchema(rawAppConfig)) {
      logger.debug("Resolving business config schema...");
      const schema = await resolveBusinessConfigSchema(
        rawAppConfig.businessConfig.schema,
        rawParams,
      );

      appConfig = {
        ...rawAppConfig,
        businessConfig: { ...rawAppConfig.businessConfig, schema },
      };
    }

    logger.debug("Validating app config...");
    const validatedConfig = validateCommerceAppConfig(appConfig);
    logger.debug("Successfully validated the app config");

    const { commerceEnv } = req.query;
    const config = commerceEnv
      ? filterAppConfigByEnv(validatedConfig, commerceEnv)
      : validatedConfig;

    const domains = getConfigDomains(rawParams.appConfig);
    const openApiSpecUrl = `${getServerUrl()}/app-config/openapi.json?ck=${getOpenApiCacheKey(domains)}`;

    return ok({
      body: { ...config, openApiSpecUrl },
    });
  },
});

/**
 * GET /openapi.json - Returns the OpenAPI spec for all SDK actions
 * @internal - Do not add to OpenAPI Spec.
 */
router.get("/openapi.json", {
  query: v.object({ ck: v.optional(v.string()) }),
  handler: async (req, { logger, rawParams }) => {
    const { ck } = req.query;
    const domains = getConfigDomains(rawParams.appConfig);

    if (ck && getOpenApiCacheKey(domains) === ck) {
      logger.debug(
        `Received request for OpenAPI spec with cache key query param: ${ck}`,
      );

      return ok({
        body: await buildOpenApiSpec(domains, logger),
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      });
    }

    // Return without caching.
    return ok({
      body: await buildOpenApiSpec(domains, logger),
    });
  },
});
