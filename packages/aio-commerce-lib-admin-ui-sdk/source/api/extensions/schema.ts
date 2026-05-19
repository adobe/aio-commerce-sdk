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

import * as v from "valibot";

/** Parameters for POST /V1/adminuisdk/extension. */
export const ExtensionRegistrationParamsSchema = v.object({
  extensionName: v.string(),
  extensionTitle: v.string(),
  extensionUrl: v.string(),
  extensionWorkspace: v.string(),
});

/** Parameters for DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. */
export const UnregisterExtensionParamsSchema = v.object({
  workspaceName: v.string(),
  extensionName: v.string(),
});

/** The parameters accepted by POST /V1/adminuisdk/extension. */
export type ExtensionRegistrationParams = v.InferInput<
  typeof ExtensionRegistrationParamsSchema
>;

/** The parameters accepted by DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. */
export type UnregisterExtensionParams = v.InferInput<
  typeof UnregisterExtensionParamsSchema
>;
