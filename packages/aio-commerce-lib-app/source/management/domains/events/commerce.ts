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

import { hasCommerceEvents } from "#config/schema/eventing";
import { defineLeafStep } from "#management/common/workflow/step";
import { deprecatedCommerceEventsStep } from "#management/deprecated/domains/events";

import { applyEventingLeaf } from "./apply";
import { planCommerceEvents } from "./plan";
import { COMMERCE_PROVIDER_TYPE } from "./utils";

import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { EventsStepContext } from "./context";
import type { EventingDomainPlan, EventingSnapshotData } from "./types";

/** Leaf step for installing and upgrading commerce event sources. */
export const commerceEventsStep = defineLeafStep({
  ...deprecatedCommerceEventsStep,
  apply: applyCommerceEvents,

  isConfigured: hasCommerceEvents,
  meta: {
    install: {
      description: "Sets up I/O Events for Adobe Commerce event sources",
      label: "Configure Commerce Events",
    },
    uninstall: {
      description: "Removes I/O Events for Adobe Commerce event sources",
      label: "Remove Commerce Events",
    },
    upgrade: {
      description:
        "Reconciles Commerce event providers, metadata, registrations and subscriptions",
      label: "Update Commerce Events",
    },
  },
  name: "commerce",
  plan: planCommerceEvents,
});

/**
 * Applies a Commerce eventing domain plan.
 *
 * @param plan - The eventing domain plan produced by `planCommerceEvents`.
 * @param context - The attempt-scoped execution context (carries the provisioned clients).
 */
export function applyCommerceEvents(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
): Promise<ApplyResult<EventingSnapshotData>> {
  return applyEventingLeaf(plan, context, COMMERCE_PROVIDER_TYPE);
}
