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

import { eventingStep } from "./events";
import { webhooksStep } from "./webhooks";
import { defineBranchStep } from "./workflow";

import type { AnyStep, BranchStep } from "./workflow";

/** The default child steps built-in in the library. */
const DEFAULT_CHILD_STEPS: AnyStep[] = [eventingStep, webhooksStep];

/** The root installation branch step. */
export const ROOT_INSTALLATION_STEP = defineBranchStep({
  name: "installation",
  meta: {
    label: "Installation",
    description: "App installation workflow",
  },
  children: DEFAULT_CHILD_STEPS,
});

/**
 * Creates a root installation step with additional custom steps.
 * Merges the default steps with any extra steps provided.
 */
export function createRootInstallationStep(
  extraSteps: AnyStep[] = [],
): BranchStep {
  if (extraSteps.length === 0) {
    return ROOT_INSTALLATION_STEP;
  }

  return {
    ...ROOT_INSTALLATION_STEP,
    children: [...DEFAULT_CHILD_STEPS, ...extraSteps],
  };
}
