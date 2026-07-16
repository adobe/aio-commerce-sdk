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

import { router } from "./router";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

/**
 * Factory to create the route handler for the `association` action.
 *
 * The `association` action manages the lifecycle of the Commerce instance the
 * app is associated with — `POST /` stores the data when the app is associated,
 * and `DELETE /` clears it on unassociation. Runtime actions consume the data
 * via `getCommerceInstance` / `getCommerceClient` from the root entrypoint.
 */
export const associationRuntimeAction =
  () => async (params: RuntimeActionParams) => {
    const handler = router.handler();
    return await handler({ ...params });
  };
