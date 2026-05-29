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
import {
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";

import { buildOpenApiSpec } from "./openapi";

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
  handler: async (_req, { logger, rawParams }) => {
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
    const config = validateCommerceAppConfig(appConfig);
    logger.debug("Successfully validated the app config");

    return ok({
      body: config,
    });
  },
});

/** GET /openapi.json - Returns the OpenAPI spec for all SDK actions */
router.get("/openapi.json", {
  handler: async (_req, { logger, rawParams }) =>
    ok({ body: await buildOpenApiSpec(rawParams.appConfig, logger) }),
});
