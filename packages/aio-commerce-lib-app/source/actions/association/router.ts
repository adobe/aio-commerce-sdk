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

import { noContent } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";

import {
  clearAssociationData,
  setAssociationData,
} from "#management/association/association-repository";

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
  logger({ name: () => "association" }),
);

/**
 * POST / - Store association data.
 *
 * Persists the Commerce instance the app is associated with so runtime actions
 * can later retrieve it via `getCommerceInstance` / `getCommerceClient`.
 */
router.post("/", {
  body: AssociationRequestBodySchema,

  handler: async (req, { logger: requestLogger }) => {
    const { commerceBaseUrl, commerceEnv } = req.body;
    requestLogger.debug(
      `Storing association data (baseUrl: "${commerceBaseUrl}", env: "${commerceEnv}")`,
    );

    await setAssociationData({ baseUrl: commerceBaseUrl, env: commerceEnv });

    return noContent();
  },
});

/**
 * DELETE / - Clear association data.
 *
 * Called when the app is unassociated.
 */
router.delete("/", {
  handler: async (_req, { logger: requestLogger }) => {
    requestLogger.debug("Clearing association data");
    await clearAssociationData();
    return noContent();
  },
});
