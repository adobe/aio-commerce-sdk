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

import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";

import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type { CleanupList, UpdatePlan } from "#management/upgrade/types";

/** Single-slot key used to store the current plan/cleanup list. */
export const PLAN_KEY = "current";

/** Creates the pending update plan store (spec §8.4); always persisted so a plan survives across invocations. */
export function createPlanStore(): Promise<KeyValueStore<UpdatePlan>> {
  return createCombinedStore<UpdatePlan>({
    cache: { keyPrefix: "update-plan" },
    persistent: { dirPrefix: "update-plan" },
  });
}

/** Creates the in-flight update cleanup list store (spec §11); always persisted so teardown can recover it. */
export function createCleanupStore(): Promise<KeyValueStore<CleanupList>> {
  return createCombinedStore<CleanupList>({
    cache: { keyPrefix: "update-cleanup" },
    persistent: { dirPrefix: "update-cleanup" },
  });
}

/** Generates a new plan ID used as the consent/staleness token for a computed update plan. */
export function generatePlanId(): string {
  return crypto.randomUUID();
}
