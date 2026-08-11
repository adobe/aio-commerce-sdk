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

import {
  configHasDestructiveChange,
  configHasUnsupportedChange,
  isEmptyPlan,
} from "./diff";

import type { ConfigDiff } from "./types";

/** What an unattended (auto) self-update should do with a computed diff. */
export type AutoUpdateDecision =
  | "noop"
  | "unsupported"
  | "review-required"
  | "reconcile";

/**
 * Classifies an auto (unattended) update into the action the self-update path should take.
 *
 * Unsupported outranks destructive: the auto path can neither apply an unsupported change nor hand
 * it to a merchant who could, whereas a destructive-but-supported change is deferred to the manual
 * review flow rather than applied unattended.
 *
 * @param diff - The computed upgrade diff.
 */
export function classifyAutoUpdate(diff: ConfigDiff): AutoUpdateDecision {
  if (isEmptyPlan(diff)) {
    return "noop";
  }

  if (configHasUnsupportedChange(diff)) {
    return "unsupported";
  }

  if (configHasDestructiveChange(diff)) {
    return "review-required";
  }

  return "reconcile";
}
