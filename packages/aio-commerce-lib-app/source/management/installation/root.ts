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

import { createCustomInstallationStep } from "./custom-installation";
import { eventingStep } from "./events";
import { webhooksStep } from "./webhooks";
import { defineBranchStep } from "./workflow";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AnyStep, BranchStep } from "./workflow";

/**
 * Creates the default child steps built-in in the library with dynamic children based on the config.
 */
function createDefaultChildSteps(
  config: CommerceAppConfigOutputModel,
): AnyStep[] {
  return [eventingStep, webhooksStep, createCustomInstallationStep(config)];
}

/**
 * Creates a root installation step with dynamic children based on the config.
 */
export function createRootInstallationStep(
  config: CommerceAppConfigOutputModel,
): BranchStep {
  return defineBranchStep({
    name: "installation",
    meta: {
      label: "Installation",
      description: "App installation workflow",
    },
    children: createDefaultChildSteps(config),
  });
}
