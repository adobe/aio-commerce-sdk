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

import { hasAdminUiSdk } from "#config/schema/admin-ui-sdk";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";

import { registerExtension } from "./helpers";
import { createAdminUiSdkStepContext } from "./utils";

import type { InferStepOutput } from "#management/installation/workflow/step";
import type { AdminUiSdkConfig, AdminUiSdkExecutionContext } from "./utils";

/** Leaf step that calls POST /V1/adminuisdk/extension to register the extension. */
const registerExtensionStep = defineLeafStep({
  name: "register-extension",
  meta: {
    label: "Register Extension",
    description: "Registers the Admin UI SDK extension in Adobe Commerce",
  },

  run: (_: AdminUiSdkConfig, context: AdminUiSdkExecutionContext) =>
    registerExtension(context),
});

/** The output data of the register extension step (auto-inferred). */
export type RegisterExtensionStepData = InferStepOutput<
  typeof registerExtensionStep
>;

/** Branch step for setting up the Admin UI SDK extension registration. */
export const adminUiSdkStep = defineBranchStep({
  name: "admin-ui-sdk",
  meta: {
    label: "Admin UI SDK",
    description: "Registers the extension with Adobe Commerce Admin UI SDK",
  },

  when: hasAdminUiSdk,
  context: createAdminUiSdkStepContext,
  children: [registerExtensionStep],
});
