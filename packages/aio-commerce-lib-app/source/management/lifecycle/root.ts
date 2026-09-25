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

import { createRootInstallationStep } from "#management/installation/root";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { LifecycleOperation } from "#management/common/orchestration";
import type { BranchStep } from "#management/common/workflow/index";

/**
 * Creates the root used by lifecycle planning and execution, declaring metadata for install,
 * upgrade and uninstall.
 *
 * @param config - The configuration used to build the dynamic custom installation children.
 * @param operation - The lifecycle operation the tree runs.
 */
export function createLifecycleRootStep(
  config: CommerceAppConfigOutputModel,
  operation: LifecycleOperation,
): BranchStep {
  // We use `installation` also for upgrades since they are essentially installations of different configs.
  const name = operation === "uninstall" ? "uninstallation" : "installation";

  // Same tree as the legacy root, so we build it through the legacy function until a major removes it.
  return createRootInstallationStep(config, {
    includeReconciliation: true,
    name,
  });
}
