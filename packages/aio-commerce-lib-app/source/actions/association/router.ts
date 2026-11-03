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

import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { noContent, ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import {
  clearAssociationData,
  setAssociationData,
} from "#management/association/repository";

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

/** POST / - Store association data and return the app's own `client_id`. */
router.post("/", {
  body: AssociationRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    const { commerceBaseUrl, commerceEnv } = req.body;

    logger.debug(
      `Storing association data (baseUrl: "${commerceBaseUrl}", env: "${commerceEnv}")`,
    );

    await setAssociationData({
      commerce: {
        baseUrl: commerceBaseUrl,
        env: commerceEnv,
      },
    });

    const { clientId } = resolveImsAuthParams(rawParams);
    return ok({ body: { clientId } });
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
