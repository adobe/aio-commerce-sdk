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

import { hasExternalEvents } from "#config/schema/eventing";
import { defineLeafStep } from "#management/common/workflow/step";
import { deprecatedExternalEventsStep } from "#management/deprecated/domains/events";

import { applyEventingLeaf } from "./apply";
import { planExternalEvents } from "./plan";
import { createExternalEvents, removeExternalEvents } from "./provisioning";
import { EXTERNAL_PROVIDER_TYPE } from "./utils";

import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { InferStepOutput } from "#management/common/workflow/step";
import type { EventsStepContext } from "./context";
import type { EventingDomainPlan, EventingSnapshotData } from "./types";

/** The output data of the External Eventing step (auto-inferred). */
export type ExternalEventsStepData = InferStepOutput<typeof externalEventsStep>;

/** Leaf step for installing and upgrading external event sources. */
export const externalEventsStep = defineLeafStep({
  ...deprecatedExternalEventsStep,
  apply: applyExternalEvents,

  isConfigured: hasExternalEvents,
  meta: {
    install: {
      description: "Sets up I/O Events for external event sources",
      label: "Configure External Events",
    },
    uninstall: {
      description: "Removes I/O Events for external event sources",
      label: "Remove External Events",
    },
    upgrade: {
      description:
        "Reconciles external event providers, metadata and registrations",
      label: "Update External Events",
    },
  },
  name: "external",
  plan: planExternalEvents,
});

/**
 * Applies an external eventing domain plan by delegating to the shared leaf convergence, supplying the
 * external install/uninstall handlers it reuses to converge providers.
 *
 * @param plan - The eventing domain plan produced by `planExternalEvents`.
 * @param context - The attempt-scoped execution context.
 */
export function applyExternalEvents(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
): Promise<ApplyResult<EventingSnapshotData>> {
  return applyEventingLeaf(plan, context, {
    install: createExternalEvents,
    isCommerce: false,
    type: EXTERNAL_PROVIDER_TYPE,
    uninstall: removeExternalEvents,
  });
}
