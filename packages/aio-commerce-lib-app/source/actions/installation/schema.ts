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

import { AppDataSchema } from "#management/installation/schema";

/** Request body for POST / and POST /validation (shared shape) */
export const InstallationRequestBodySchema = v.object({
  appData: AppDataSchema,
  commerceBaseUrl: v.string(),
  commerceEnv: CommerceEnvSchema,
  ioEventsEnv: v.string(),
  ioEventsUrl: v.string(),
});
