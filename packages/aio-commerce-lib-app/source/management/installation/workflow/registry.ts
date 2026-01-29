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

import { eventingStep } from "../events";
import { webhooksStep } from "../webhooks";

import type { AnyStep } from "./step";

/** The root steps built-in in the library. */
export const DEFAULT_STEPS: AnyStep[] = [eventingStep, webhooksStep];

/** Builds a step registry map from step name to step definition. */
export function buildStepRegistry(
  extraSteps: AnyStep[] = [],
): Map<string, AnyStep> {
  const allSteps = [...DEFAULT_STEPS, ...extraSteps];
  return new Map(allSteps.map((step) => [step.name, step]));
}
