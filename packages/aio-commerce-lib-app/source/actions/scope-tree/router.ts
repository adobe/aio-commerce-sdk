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
  badRequest,
  internalServerError,
  nonAuthoritativeInformation,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";
import { inspect } from "@aio-commerce-sdk/common-utils/logging";

import {
  SetCustomScopeTreeBodySchema,
  SyncCommerceScopesBodySchema,
} from "./schema";

import type { SetCustomScopeTreeRequest } from "@adobe/aio-commerce-lib-config";

/**
 * Scope Tree action router.
 *
 * Routes:
 * - GET /              Retrieve the scope tree.
 * - PUT /              Set custom scope tree.
 * - POST /commerce     Sync commerce scopes
 * - DELETE /commerce   Unsync commerce scopes
 */
export const router = new HttpActionRouter().use(
  withLogger({
    name: () => "scope-tree",
  }),
);

/** GET / - Get scope tree */
router.get("/", {
  handler: async (_req, ctx) => {
    const { logger } = ctx;
    const result = await getScopeTree();

    logger.debug(
      `Successfully retrieved scope tree (cached: ${result.isCachedData}): ${inspect(result.scopeTree)}`,
    );

    if (result.isCachedData) {
      return nonAuthoritativeInformation({
        body: { scopes: result.scopeTree },
        headers: { "x-cache": "hit" },
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
  handler: async (req, ctx) => {
    const { logger } = ctx;
    logger.debug(
      `Setting custom scope tree with ${req.body.scopes?.length || 0} scopes`,
    );

    const request = {
      scopes: req.body.scopes,
    } satisfies SetCustomScopeTreeRequest;

    let result: Awaited<ReturnType<typeof setCustomScopeTree>>;
    logger.debug(`Setting custom scope tree: ${inspect(request)}`);

    try {
      result = await setCustomScopeTree(request);
    } catch (err) {
      if (err instanceof Error && "isValidationError" in err) {
        logger.debug(`Custom scope tree validation failed: ${err.message}`);
        return badRequest({ body: { message: err.message } });
      }

      throw err;
    }

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
          error: result.error,
          message: "An internal server error occurred",
        },
      });
    }

    if (!result.synced) {
      logger.debug(
        `Commerce scopes not synced (cached): ${inspect(result.scopeTree)}`,
      );

      return nonAuthoritativeInformation({
        body: {
          scopes: result.scopeTree,
          synced: false,
        },
        headers: { "x-cache": "hit" },
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
