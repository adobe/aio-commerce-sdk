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
import { defineBranchStep } from "#management/installation/workflow/index";

import { commerceEventsStep } from "./commerce";
import { createEventsStepContext } from "./context";
import { externalEventsStep } from "./external";

/** Root eventing step that contains commerce and external event sub-steps. */
export const eventingStep = defineBranchStep({
  name: "eventing",
  meta: {
    label: "Eventing",
    description:
      "Sets up the I/O Events and the Commerce events required by the application",
  },

  when: hasEventing,
  context: createEventsStepContext,
  children: [commerceEventsStep, externalEventsStep],
});
