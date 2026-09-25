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

import { CommerceEnvSchema } from "@adobe/aio-commerce-lib-core/commerce";
import * as v from "valibot";

// A plain `v.object` (not `strictObject`) so unknown keys stay ignored.
/**
 * Request body for POST / — store the Commerce instance the app is associated
 * with. The Commerce App Management Service orchestrates association: it calls
 * this action and reads the app's own `client_id` from the response to bind
 * ownership of the record, so no identifiers need to be sent here.
 */
export const AssociationRequestBodySchema = v.object({
  commerceBaseUrl: v.pipe(
    v.string(),
    v.url(
      "The 'commerceBaseUrl' field must be a valid absolute URL (e.g., 'https://my-store.example.com')",
    ),
  ),
  commerceEnv: CommerceEnvSchema,
});
