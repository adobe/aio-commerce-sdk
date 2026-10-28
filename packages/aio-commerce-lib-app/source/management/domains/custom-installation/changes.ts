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

import { toItemRef } from "#management/common/workflow/resource";

import { findDeclaredStep } from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ResourceChange } from "#management/common/workflow/resource";

/**
 * The change of one custom installation step between the baseline and the target config: `add` when
 * only the target declares it, `remove` when only the baseline does. A step both declare is never
 * an `update`, since an installed step does not run again.
 *
 * @param name - The `name` of the step.
 * @param baselineConfig - The installed config, or `null` when nothing is installed.
 * @param targetConfig - The config to install, or `null` when nothing should remain installed.
 */
export function planCustomScriptChanges(
  name: string,
  baselineConfig: CommerceAppConfigOutputModel | null,
  targetConfig: CommerceAppConfigOutputModel | null,
): ResourceChange[] {
  const before = baselineConfig && findDeclaredStep(baselineConfig, name);
  const after = targetConfig && findDeclaredStep(targetConfig, name);

  if (after && !before) {
    return [{ itemRef: toItemRef(name, after), key: name, kind: "add" }];
  }

  if (before && !after) {
    return [{ itemRef: toItemRef(name, before), key: name, kind: "remove" }];
  }

  return [];
}
