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

import { hasEventing } from "#config/schema/eventing";
import { defineBranchStep } from "#management/common/workflow/index";

import { applyCommerceEvents, applyExternalEvents } from "./apply";
import { commerceEventsStep } from "./commerce";
import { createEventsStepContext } from "./context";
import { externalEventsStep } from "./external";
import { planCommerceEvents, planExternalEvents } from "./plan";

/**
 * Commerce eventing leaf extended with the upgrade `plan`/`apply` capability. Composed here (rather
 * than in `./commerce`) so `apply` can reuse `commerceEventsStep.install`/`uninstall` without an
 * import cycle.
 */
const commerceEventsUpgradeStep = {
  ...commerceEventsStep,
  apply: applyCommerceEvents,
  meta: {
    ...commerceEventsStep.meta,
    upgrade: {
      description:
        "Reconciles Commerce event providers, metadata, registrations and subscriptions",
      label: "Update Commerce Events",
    },
  },
  plan: planCommerceEvents,
};

/** External eventing leaf extended with the upgrade `plan`/`apply` capability. */
const externalEventsUpgradeStep = {
  ...externalEventsStep,
  apply: applyExternalEvents,
  meta: {
    ...externalEventsStep.meta,
    upgrade: {
      description:
        "Reconciles external event providers, metadata and registrations",
      label: "Update External Events",
    },
  },
  plan: planExternalEvents,
};

/** Root eventing step that contains commerce and external event sub-steps. */
export const eventingStep = defineBranchStep({
  children: [commerceEventsUpgradeStep, externalEventsUpgradeStep],
  context: createEventsStepContext,

  isConfigured: hasEventing,
  meta: {
    install: {
      description:
        "Sets up the I/O Events and the Commerce events required by the application",
      label: "Eventing",
    },
    uninstall: {
      description:
        "Removes the I/O Events and Commerce events configured by the application",
      label: "Eventing",
    },
  },
  name: "eventing",
});
