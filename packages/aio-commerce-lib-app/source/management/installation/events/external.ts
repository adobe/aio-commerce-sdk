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
import { defineLeafStep } from "#management/installation/workflow/step";

import { onboardIoEvents } from "./helpers";
import { EXTERNAL_PROVIDER_TYPE, getIoEventsExistingData } from "./utils";

import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsExecutionContext } from "./context";

/** Leaf step for installing external event sources. */
export const externalEventsStep = defineLeafStep({
  name: "external",
  meta: {
    label: "Configure External Events",
    description: "Sets up I/O Events for external event sources",
  },

  when: hasExternalEvents,
  run: async (config, context: EventsExecutionContext) => {
    const { logger } = context;
    logger.debug(
      "Starting installation of External Events with config:",
      config,
    );

    // biome-ignore lint/suspicious/noEvolvingTypes: We want the type to be auto-inferred
    const stepData = [];
    const existingIoEventsData = await getIoEventsExistingData(context);

    for (const { provider, events } of config.eventing.external) {
      const { providerData, eventsData } = await onboardIoEvents(
        {
          context,
          metadata: config.metadata,
          provider,
          events,
          providerType: EXTERNAL_PROVIDER_TYPE,
        },
        existingIoEventsData,
      );

      stepData.push({
        provider: {
          config: provider,
          data: {
            ioEvents: providerData,
            events: {
              config: events,
              data: eventsData,
            },
          },
        },
      });
    }

    logger.debug("Completed External Events installation step.");
    return stepData;
  },
});

/** The output data of the External Eventing step (auto-inferred). */
export type ExternalEventsStepData = InferStepOutput<typeof externalEventsStep>;
