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
import type { SucceededWorkflowState } from "#management/common/workflow/types";

/** The kind of lifecycle operation an orchestration run performs. */
export type LifecycleOperation = "install" | "upgrade" | "uninstall";

/**
 * A captured snapshot of installed app state. The `config` is the last successfully installed
 * configuration and serves as the baseline an upgrade diffs the target config against. Deployed
 * resource identities are resolved from live state at reconcile time, so no per-resource data is
 * persisted here.
 */
export type AppStateSnapshot = Pick<SucceededWorkflowState, "id" | "config"> & {
  /** The last installed configuration, used as the upgrade baseline. */
  config: CommerceAppConfigOutputModel;
};
