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

import { RegistrationResponseSchema } from "./schema";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { AdminUiSdkRegistration } from "#config/schema/admin-ui-sdk";

/** The arguments required to create the runtime action for the registration action. */
export type RuntimeActionFactoryArgs = {
  registration: AdminUiSdkRegistration;
};

/** The arguments received by all the handlers in the registration action. */
type RuntimeActionArgs = RuntimeActionParams & RuntimeActionFactoryArgs;
interface RegistrationActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

/**
 * Registration action router.
 *
 * Routes:
 * - GET /   - Retrieve the Admin UI SDK registration.
 */
export const router = new HttpActionRouter<RegistrationActionContext>().use(
  logger({ name: () => "registration" }),
);

/** GET / - Return Admin UI SDK registration object */
router.get("/", {
  responses: { 200: RegistrationResponseSchema },
  handler: async (_req, { logger, rawParams }) => {
    logger.debug("Returning Admin UI SDK registration...");
    return ok({ body: { registration: rawParams.registration } });
  },
});
