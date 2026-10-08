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
import type { DomainPlan } from "#management/common/workflow/resource";

/**
 * Identity of a custom installation step that has run at least once, as persisted across
 * upgrades. `name` is the step's stable identity; `script` records the path that ran, so a step
 * removed from the config can still be resolved and uninstalled later.
 */
export type CustomInstallationStepIdentity = {
  /** Matches `installation.customInstallationSteps[].name`. */
  name: string;

  /** The script path this step pointed to when it last (successfully) ran. */
  script: string;
};

/**
 * Snapshot data persisted for the custom installation steps domain: every step that has ever
 * run, whether or not it's still present in the current config. A step is never removed from this
 * list during an upgrade, so a later unassociate can still resolve and call its `uninstall`.
 */
export type CustomInstallationSnapshotData = {
  executedSteps: CustomInstallationStepIdentity[];
};

/**
 * The plan the custom installation steps domain proposes: `add` for first-time steps, `remove`
 * (informational) for steps no longer in the target config. Also carries what `apply` needs to
 * converge: the full baseline history and the target config to run new steps against.
 */
export type CustomInstallationDomainPlan =
  DomainPlan<CustomInstallationStepIdentity> & {
    /** Every step that ever ran, from the baseline snapshot (`[]` when there is no baseline). */
    baselineExecutedSteps: CustomInstallationStepIdentity[];

    /** The target configuration to converge to, or `null` when none is available. */
    targetConfig: CommerceAppConfigOutputModel | null;
  };
