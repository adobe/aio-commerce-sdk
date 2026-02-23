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

import { ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";

import { validateCommerceAppConfig } from "#config/lib/validate";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Arguments for the runtime action factory. */
type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfigOutputModel;
};

/** Params received by all handlers. */
type RuntimeActionArgs = RuntimeActionParams & RuntimeActionFactoryArgs;

/** Router for the app config actions. */
const router = new HttpActionRouter().use(
  logger({ name: () => "get-app-config" }),
);

/** GET / - Get app config */
router.get("/", {
  handler: async (req, { logger }) => {
    logger.debug("Validating app config...");

    const { appConfig } = req.params as RuntimeActionArgs;
    const config = validateCommerceAppConfig(appConfig);
    logger.debug("Successfully validated the app config");

    return ok({
      body: config,
    });
  },
});

/** The route handler for the runtime action. */
export const appConfigRuntimeAction =
  ({ appConfig }: RuntimeActionFactoryArgs) =>
  async (params: RuntimeActionParams) => {
    const handler = router.handler();
    return await handler({
      ...params,
      appConfig,
    });
  };
