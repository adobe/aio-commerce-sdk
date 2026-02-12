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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

/** Schema for validating Adobe I/O app credentials required for installation. */
export const AppCredentialsSchema = v.object({
  consumerOrgId: v.pipe(nonEmptyStringValueSchema("consumerOrgId")),
  projectId: v.pipe(nonEmptyStringValueSchema("projectId")),
  workspaceId: v.pipe(nonEmptyStringValueSchema("workspaceId")),
});

/** Type for Adobe I/O app credentials. */
export type AppCredentials = v.InferOutput<typeof AppCredentialsSchema>;
