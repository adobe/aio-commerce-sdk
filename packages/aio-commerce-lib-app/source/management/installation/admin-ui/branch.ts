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

import { hasAdminUi } from "#config/schema/admin-ui";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";

import {
  enableAdminUiSdk,
  registerExtension,
  unregisterExtension,
} from "./helpers";
import { createAdminUiStepContext } from "./utils";

import type { InferStepOutput } from "#management/installation/workflow/step";
import type { AdminUiConfig, AdminUiExecutionContext } from "./utils";

/**
 * Leaf step that enables the Admin UI SDK (PUT) on install. Runs before
 * {@link registerExtensionStep} so Commerce accepts the extension registration.
 * Install-only: enabling the SDK is not reverted on uninstall since other
 * extensions may still rely on it.
 */
const enableAdminUiSdkStep = defineLeafStep({
  name: "enable-admin-ui-sdk",
  meta: {
    install: {
      label: "Enable Admin UI SDK",
      description: "Enables the Admin UI SDK in Adobe Commerce",
    },
  },

  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    enableAdminUiSdk(context),
});

/** Leaf step that registers the extension (POST) on install and unregisters it (DELETE) on uninstall. */
const registerExtensionStep = defineLeafStep({
  name: "register-extension",
  meta: {
    install: {
      label: "Register Extension",
      description: "Registers the Admin UI extension in Adobe Commerce",
    },
    uninstall: {
      label: "Unregister Extension",
      description: "Removes the Admin UI extension from Adobe Commerce",
    },
  },

  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    registerExtension(context),

  uninstall: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    unregisterExtension(context),
});

/** The output data of the register extension step (auto-inferred). */
export type RegisterExtensionStepData = InferStepOutput<
  typeof registerExtensionStep
>;

/** Branch step for setting up the Admin UI extension registration. */
export const adminUiStep = defineBranchStep({
  name: "admin-ui",
  meta: {
    install: {
      label: "Admin UI",
      description: "Registers the extension with Adobe Commerce Admin UI",
    },
    uninstall: {
      label: "Admin UI",
      description: "Removes the extension from Adobe Commerce Admin UI",
    },
  },

  when: hasAdminUi,
  context: createAdminUiStepContext,
  children: [enableAdminUiSdkStep, registerExtensionStep],
});
