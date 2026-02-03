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

import { resolveCommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import {
  defineRoute,
  logger,
  Router,
} from "@adobe/aio-commerce-lib-core/actions";
import {
  internalServerError,
  nonAuthoritativeInformation,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";
import * as v from "valibot";

import {
  getScopeTree,
  setCustomScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
} from "../config-manager";

import type { SetCustomScopeTreeRequest } from "../types";

// The router that will hold the scope-tree routes
export const router = new Router().use(logger());

/** GET /scope-tree - Get scope tree */
const getScopeTreeRoute = defineRoute(router, {
  handler: async (_req, ctx) => {
    const { logger } = ctx;
    const result = await getScopeTree();

    logger.debug(
      `Successfully retrieved scope tree (cached: ${result.isCachedData}): ${inspect(result.scopeTree)}`,
    );

    if (result.isCachedData) {
      return nonAuthoritativeInformation({
        headers: { "x-cache": "hit" },
        body: { scopes: result.scopeTree },
      });
    }

    return ok({
      body: { scopes: result.scopeTree },
    });
  },
});

/** POST /scope-tree - Set custom scope tree */
const setScopeTreeRoute = defineRoute(router, {
  body: v.object({
    scopes: v.array(v.any()),
  }),

  handler: async (req, ctx) => {
    const { logger } = ctx;
    logger.debug(
      `Setting custom scope tree with ${req.body.scopes?.length || 0} scopes`,
    );

    const request = { scopes: req.body.scopes } as SetCustomScopeTreeRequest;
    logger.debug(`Setting custom scope tree: ${inspect(request)}`);

    const result = await setCustomScopeTree(request);
    logger.debug(`Successfully set custom scope tree: ${inspect(result)}`);

    return ok({
      body: { result },
      headers: {
        "Cache-Control": "no-store",
      },
    });
  },
});

/** POST /scope-tree/commerce - Sync commerce scopes */
const syncCommerceScopesRoute = defineRoute(router, {
  body: v.object({
    commerceBaseUrl: v.string(),
    commerceEnv: v.optional(v.string()),
  }),

  handler: async (req, ctx) => {
    const { logger } = ctx;
    logger.debug("Syncing commerce scopes...");

    const { commerceBaseUrl, commerceEnv } = req.body;
    const paramsWithCommerceConfig = {
      AIO_COMMERCE_API_BASE_URL: commerceBaseUrl,
      ...(commerceEnv && {
        AIO_COMMERCE_API_FLAVOR: commerceEnv,
      }),
    };

    const commerceConfig = resolveCommerceHttpClientParams(
      paramsWithCommerceConfig,
      { tryForwardAuthProvider: true },
    );

    const result = await syncCommerceScopes(commerceConfig);

    if (result.error) {
      logger.error(`Error syncing commerce scopes: ${inspect(result.error)}`);
      return internalServerError({
        body: {
          message: "An internal server error occurred",
          error: result.error,
        },
      });
    }

    if (!result.synced) {
      logger.debug(
        `Commerce scopes not synced (cached): ${inspect(result.scopeTree)}`,
      );

      return nonAuthoritativeInformation({
        headers: { "x-cache": "hit" },
        body: {
          scopes: result.scopeTree,
          synced: false,
        },
      });
    }

    logger.debug(
      `Successfully synced commerce scopes: ${inspect(result.scopeTree)}`,
    );

    return ok({
      body: {
        scopes: result.scopeTree,
        synced: true,
      },
    });
  },
});

/** DELETE /scope-tree/commerce - Unsync commerce scopes */
const unsyncCommerceScopesRoute = defineRoute(router, {
  handler: async (_req, ctx) => {
    const { logger } = ctx;

    logger.debug("Unsyncing commerce scopes...");
    const result = await unsyncCommerceScopes();

    if (result) {
      const message = "Commerce scopes unsynced successfully";

      logger.debug(message);
      return ok(message);
    }

    return ok("No commerce scopes to unsync");
  },
});

/** The handler method for the scope-tree action. */
export const scopeTreeRuntimeAction = router
  .get("/scope-tree", getScopeTreeRoute)
  .post("/scope-tree", setScopeTreeRoute)
  .post("/scope-tree/commerce", syncCommerceScopesRoute)
  .delete("/scope-tree/commerce", unsyncCommerceScopesRoute)
  .handler();
