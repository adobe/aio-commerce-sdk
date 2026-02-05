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

import { defineLeafStep } from "#management/installation/workflow/step";

import { onboardCommerceSubscriptions, onboardIoEvents } from "./helpers";
import { COMMERCE_PROVIDER_TYPE, getIoEventsExistingData } from "./utils";

import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CommerceEvent } from "#config/schema/eventing";
import type { EventsDataFromIo } from "#management/installation/events/types";
import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsConfig, EventsExecutionContext } from "./utils";

/** Config type when commerce event sources are present. */
export type CommerceEventsConfig = SetRequiredDeep<
  EventsConfig,
  "eventing.commerce"
>;

/** Check if config has commerce event sources. */
export function hasCommerceEvents(
  config: CommerceAppConfigOutputModel,
): config is CommerceEventsConfig {
  return (
    Array.isArray(config?.eventing?.commerce) &&
    config.eventing.commerce.length > 0
  );
}

/** Leaf step for installing commerce event sources. */
export const commerceEventsStep = defineLeafStep({
  name: "commerce",
  meta: {
    label: "Configure Commerce Events",
    description: "Sets up I/O Events for Adobe Commerce event sources",
  },

  when: hasCommerceEvents,
  run: async (config, context: EventsExecutionContext) => {
    const { logger } = context;
    logger.debug(
      "Starting installation of Commerce Events with config:",
      config,
    );

    // biome-ignore lint/suspicious/noEvolvingTypes: We want the type to be auto-inferred
    const stepData = [];
    const existingIoEventsData = await getIoEventsExistingData(context);

    for (const { provider, events } of config.eventing.commerce) {
      const { providerData, eventsData } = await onboardIoEvents(
        {
          context,
          metadata: config.metadata,
          provider,
          events,
          providerType: COMMERCE_PROVIDER_TYPE,
        },
        existingIoEventsData,
      );

      const existingSubscriptionsData =
        await context.commerceEventsClient.getAllEventSubscriptions();
      const commerceEventsData =
        eventsData satisfies EventsDataFromIo<CommerceEvent>;

      const { subscriptionsData } = await onboardCommerceSubscriptions(
        {
          context,
          metadata: config.metadata,
          provider,
          data: {
            ...providerData,
            events: commerceEventsData,
          },
        },
        existingSubscriptionsData,
      );

      stepData.push({
        provider: {
          config: provider,
          data: {
            ...providerData,
            events: eventsData,
            subscriptions: subscriptionsData,
          },
        },
      });
    }

    logger.debug("Completed Commerce Events installation step.");
    return stepData;
  },
});

/** The output data of the Commerce Eventing step (auto-inferred). */
export type CommerceEventsStepData = InferStepOutput<typeof commerceEventsStep>;
