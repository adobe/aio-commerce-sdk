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
  getScopeTree,
  setCustomScopeTree,
  syncCommerceScopes,
  unsyncCommerceScopes,
} from "@adobe/aio-commerce-lib-config";
import {
  internalServerError,
  nonAuthoritativeInformation,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";

import {
  CachedScopeTreeResponseSchema,
  CachedSyncedScopeTreeResponseSchema,
  ScopeTreeResponseSchema,
  SetCustomScopeTreeBodySchema,
  SetCustomScopeTreeResponseSchema,
  SyncCommerceScopesBodySchema,
  SyncedScopeTreeResponseSchema,
  UnsyncScopeTreeResponseSchema,
} from "./schema";

import type { SetCustomScopeTreeRequest } from "@adobe/aio-commerce-lib-config";

/**
 * Scope Tree action router.
 *
 * Routes:
 * - GET /  - Retrieve the scope tree.
 * - PUT /  - Set custom scope tree.
 * - POST /commerce - Sync commerce scopes
 * - DELETE /commerce - Unsync commerce scopes
 */
export const router = new HttpActionRouter().use(
  logger({
    name: () => "scope-tree",
  }),
);

/** GET / - Get scope tree */
router.get("/", {
  metadata: {
    operationId: "getScopeTree",
    summary: "Get Scope Tree",
    description: "Returns the scope tree used by Commerce configuration flows.",

    responses: {
      200: {
        schema: ScopeTreeResponseSchema,
        description: "The current scope tree.",
      },
      203: {
        schema: CachedScopeTreeResponseSchema,
        description:
          "The cached scope tree returned when fresh scope data is not available.",
      },
    },
  },

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

/** PUT / - Set custom scope tree */
router.put("/", {
  body: SetCustomScopeTreeBodySchema,
  metadata: {
    operationId: "setCustomScopeTree",
    summary: "Set Custom Scope Tree",
    description:
      "Stores a custom scope tree to override the synchronized Commerce scope tree.",

    responses: {
      200: {
        schema: SetCustomScopeTreeResponseSchema,
        description: "The stored custom scope tree result.",
      },
    },
  },

  handler: async (req, ctx) => {
    const { logger } = ctx;
    logger.debug(
      `Setting custom scope tree with ${req.body.scopes?.length || 0} scopes`,
    );

    const request = {
      scopes: req.body.scopes,
    } satisfies SetCustomScopeTreeRequest;

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

/** POST /commerce - Sync commerce scopes */
router.post("/commerce", {
  body: SyncCommerceScopesBodySchema,
  metadata: {
    operationId: "syncCommerceScopes",
    summary: "Sync Commerce Scopes",
    description:
      "Synchronizes scope data from Adobe Commerce and updates the local scope tree.",

    responses: {
      200: {
        schema: SyncedScopeTreeResponseSchema,
        description: "The synchronized Commerce scope tree.",
      },
      203: {
        schema: CachedSyncedScopeTreeResponseSchema,
        description:
          "The cached scope tree returned when Commerce scopes are not synchronized.",
      },
    },
  },

  handler: async (req, ctx) => {
    const { logger } = ctx;
    logger.debug("Syncing commerce scopes...");

    const { commerceBaseUrl, commerceEnv } = req.body;
    const paramsWithCommerceConfig = {
      ...ctx.rawParams,
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

/** DELETE /commerce - Unsync commerce scopes */
router.delete("/commerce", {
  metadata: {
    operationId: "unsyncCommerceScopes",
    summary: "Unsync Commerce Scopes",
    description:
      "Removes the synchronized Commerce scope tree and returns the unsync result.",

    responses: {
      200: {
        schema: UnsyncScopeTreeResponseSchema,
        description: "The result of removing synchronized Commerce scope data.",
      },
    },
  },

  handler: async (_req, ctx) => {
    const { logger } = ctx;
    logger.debug("Unsyncing commerce scopes...");

    const { unsynced } = await unsyncCommerceScopes();

    if (unsynced) {
      const message = "Commerce scopes unsynced successfully";

      logger.debug(message);
      return ok(message);
    }

    const message = "No commerce scopes to unsync";
    logger.debug(message);

    return ok(message);
  },
});
