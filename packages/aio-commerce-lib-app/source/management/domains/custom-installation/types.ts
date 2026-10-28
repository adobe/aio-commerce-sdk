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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStep } from "#config/schema/installation";
import type { DomainPlan } from "#management/common/workflow/resource";

/**
 * Identity of a custom installation step that has run at least once, as persisted across
 * upgrades. `name` is the step's stable identity; `script` records the path that ran.
 */
export type CustomInstallationStepIdentity = {
  /** Matches `installation.customInstallationSteps[].name`. */
  name: string;

  /** The script path this step pointed to when it last (successfully) ran. */
  script: string;
};

/**
 * The plan of a single custom installation step: `add` to run its `install`, or `remove` to run
 * its `uninstall`. Also carries the baseline configuration, handed to `uninstall`.
 */
export type CustomScriptDomainPlan =
  DomainPlan<CustomInstallationStepIdentity> & {
    /** The baseline configuration, handed to the `uninstall` of a removed step, or `null` without one. */
    baselineConfig: CommerceAppConfigOutputModel | null;
  };

/** What is known about a custom installation step when the step tree is built. */
export type CustomScriptRun = {
  /** The step as the deployed config declares it, or `null` when it no longer does. */
  declared: CustomInstallationStep | null;

  /** The step as it last ran, or `null` when it has not run. */
  executed: CustomInstallationStepIdentity | null;

  /** Whether a run history is stored. Without one, whether the step ran is unknown. */
  isHistoryStored: boolean;
};
