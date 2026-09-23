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
  getImsAuthProvider,
  resolveImsAuthParams,
} from "@adobe/aio-commerce-lib-auth";
import { conflict, noContent } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import {
  clearAssociationData,
  setAssociationData,
} from "#management/association/repository";
import {
  CamsAdoptConflictError,
  createCamsClient,
  resolveCamsBaseUrl,
} from "#management/cams/index";

import { AssociationRequestBodySchema } from "./schema";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";

/** The context for the association action. */
type AssociationActionContext = BaseContext;

/**
 * Association action router.
 *
 * Routes:
 * - POST /   Store Commerce instance details (`baseUrl`, `env`)
 * - DELETE / Clear stored Commerce instance details
 */
export const router = new HttpActionRouter<AssociationActionContext>().use(
  withLogger({ name: () => "association" }),
);

/**
 * POST / - Adopt the record, then store association data.
 *
 * When the request carries the `:adopt` identifiers, first claims ownership of
 * the app's Commerce App Management Service record via the `:adopt` handshake
 * (binding it to the app's own S2S `client_id`); then persists the Commerce
 * instance the app is associated with so runtime actions can later retrieve it
 * via `getCommerceInstance` / `getCommerceClient`.
 *
 * Adoption is best-effort: it fails the request only on a terminal ownership
 * conflict. Missing identifiers (e.g. an older Commerce App Management frontend),
 * a missing record, an unreachable service, or missing S2S credentials are
 * logged and swallowed — association still succeeds and ownership binds later on
 * the first owner-gated write. This keeps apps on an older SDK (which never
 * adopt) and mid-migration records working.
 */
router.post("/", {
  body: AssociationRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    const { commerceBaseUrl, commerceEnv, commerceId, workspaceId, extId } =
      req.body;

    // The identifiers are optional: an older Commerce App Management frontend
    // won't send them. Only adopt when all three are present; otherwise skip it
    // and let ownership bind on the first owner-gated write.
    if (commerceId && workspaceId && extId) {
      try {
        const camsClient = createCamsClient({
          authProvider: getImsAuthProvider(resolveImsAuthParams(rawParams)),
          baseUrl: resolveCamsBaseUrl(rawParams),
          identity: { commerceId, extId, workspaceId },
          logger,
        });

        const recordId = await camsClient.ensureAdopted();
        // Ownership binding is a notable lifecycle event, so surface it at info
        // level (the deferral/rejection paths below are already warn/error).
        logger.info(
          `Adopted Commerce App Management Service record "${recordId}"`,
        );
      } catch (error) {
        if (error instanceof CamsAdoptConflictError) {
          logger.error(`Adoption rejected: ${error.message}`);
          return conflict(error.message);
        }

        logger.warn(
          `Adoption deferred; ownership will bind on the next write: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    } else {
      logger.debug(
        "Adopt identifiers absent; skipping adoption — ownership binds on the first owner-gated write",
      );
    }

    logger.debug(
      `Storing association data (baseUrl: "${commerceBaseUrl}", env: "${commerceEnv}")`,
    );

    await setAssociationData({
      commerce: {
        baseUrl: commerceBaseUrl,
        env: commerceEnv,
      },
    });

    return noContent();
  },
});

/**
 * DELETE / - Clear association data.
 *
 * Called when the app is unassociated.
 */
router.delete("/", {
  handler: async (_req, { logger }) => {
    logger.debug("Clearing association data");
    await clearAssociationData();
    return noContent();
  },
});
