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
} from "#management/common/workflow/step";

import { applyAdminUi } from "./apply";
import {
  enableAdminUiSdk,
  registerExtension,
  unregisterExtension,
} from "./helpers";
import { planAdminUi } from "./plan";
import { createAdminUiStepContext } from "./utils";

import type { AdminUiConfig, AdminUiExecutionContext } from "./utils";

/**
 * Leaf step that enables the Admin UI SDK (PUT) on install, before
 * {@link registerExtensionStep}. Install-only: it has no uninstall handler.
 */
const enableAdminUiSdkStep = defineLeafStep({
  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    enableAdminUiSdk(context),
  meta: {
    install: {
      description: "Enables the Admin UI SDK in Adobe Commerce",
      label: "Enable Admin UI SDK",
    },
  },
  name: "enable-admin-ui-sdk",
});

/**
 * Leaf step that registers the extension (POST) on install and unregisters it
 * (DELETE) on uninstall, and reconciles it during upgrade via `plan`/`apply`.
 */
const registerExtensionStep = defineLeafStep({
  apply: applyAdminUi,
  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    registerExtension(context),
  meta: {
    install: {
      description: "Registers the Admin UI extension in Adobe Commerce",
      label: "Register Extension",
    },
    uninstall: {
      description: "Removes the Admin UI extension from Adobe Commerce",
      label: "Unregister Extension",
    },
    upgrade: {
      description:
        "Registers, refreshes, or removes the Admin UI extension to match the updated configuration",
      label: "Update Extension",
    },
  },
  name: "register-extension",
  plan: planAdminUi,

  uninstall: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    unregisterExtension(context),
});

// Derived from `registerExtension` rather than `InferStepOutput<typeof
// registerExtensionStep>`, which would be self-referential (the step's own
// plan/apply handlers consume this type).
/** The register step's output (`{ extensionId }`), also persisted as the domain's snapshot data. */
export type RegisterExtensionStepData = Awaited<
  ReturnType<typeof registerExtension>
>;

/** Branch step for setting up the Admin UI extension registration. */
export const adminUiStep = defineBranchStep({
  children: [enableAdminUiSdkStep, registerExtensionStep],
  context: createAdminUiStepContext,

  isConfigured: hasAdminUi,
  meta: {
    install: {
      description: "Registers the extension with Adobe Commerce Admin UI",
      label: "Admin UI",
    },
    uninstall: {
      description: "Removes the extension from Adobe Commerce Admin UI",
      label: "Admin UI",
    },
    upgrade: {
      description:
        "Reconciles the extension's Admin UI components with Adobe Commerce",
      label: "Admin UI",
    },
  },
  name: "admin-ui",
});
