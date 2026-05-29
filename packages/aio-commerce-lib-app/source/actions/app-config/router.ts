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
import { hasAdminUiSdk } from "#config/schema/admin-ui-sdk";
import { requiresInstallation } from "#config/schema/app";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";
import openAPISpec from "#generated/openapi.gen.json" with { type: "json" };

import { AppConfigResponseSchema } from "./schema";

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
 * - GET /               - Retrieve the Commerce App configuration.
 * - GET /openapi.json   - Returns the OpenAPI spec for all SDK actions
 */
export const router = new HttpActionRouter<AppConfigActionContext>().use(
  logger({ name: () => "app-config" }),
);

/** GET / - Get app config */
router.get("/", {
  metadata: {
    operationId: "getAppConfig",
    summary: "Get Commerce App Configuration",
    description:
      "Returns the Commerce App configuration after resolving and validating it against the schema.",

    responses: {
      200: {
        schema: AppConfigResponseSchema,
        description: "The resolved and validated Commerce App configuration.",
      },
    },
  },

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
  metadata: { internal: true },
  handler: (_req, { logger, rawParams }) => {
    const spec = structuredClone(openAPISpec);
    const deleteSpecPath = (path: keyof typeof openAPISpec.paths) => {
      if (spec.paths[path]) {
        logger.debug(`Stripping OpenAPI spec path: ${path}`);
        delete spec.paths[path];
      }
    };

    if (!hasBusinessConfigSchema(rawParams.appConfig)) {
      logger.debug(
        "Application doesn't define business configuration, stripping references...",
      );

      deleteSpecPath("/config");
      deleteSpecPath("/scope-tree");
      deleteSpecPath("/scope-tree/commerce");
    }

    if (!hasAdminUiSdk(rawParams.appConfig)) {
      logger.debug(
        "Application doesn't define Admin UI SDK registration, stripping references...",
      );

      deleteSpecPath("/registration");
    }

    if (!requiresInstallation(rawParams.appConfig)) {
      logger.debug(
        "Application doesn't require installation, stripping references...",
      );

      deleteSpecPath("/installation");
    }

    spec.servers[0].url = `https://${process.env.__OW_NAMESPACE}.adobeioruntime.net/api/v1/web/app-management`;
    return ok({ body: spec });
  },
});
