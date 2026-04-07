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
import { defineLeafStep } from "#management/installation/workflow/step";

import {
  configureCommerceEventing,
  onboardCommerceEventing,
  onboardIoEvents,
} from "./helpers";
import {
  COMMERCE_PROVIDER_TYPE,
  getCommerceEventingExistingData,
  getIoEventsExistingData,
  makeWorkspaceConfig,
} from "./utils";

import type { CommerceEventsConfig } from "#config/schema/eventing";
import type { InferStepOutput } from "#management/installation/workflow/step";
import type { EventsExecutionContext } from "./context";

/** The output data of the Commerce Eventing step (auto-inferred). */
export type CommerceEventsStepData = InferStepOutput<typeof commerceEventsStep>;

/** Leaf step for installing commerce event sources. */
export const commerceEventsStep = defineLeafStep({
  name: "commerce",
  meta: {
    label: "Configure Commerce Events",
    description: "Sets up I/O Events for Adobe Commerce event sources",
  },

  when: hasCommerceEvents,
  run: createCommerceEvents,
});

/**
 * Creates all needed entities for Eventing to work with Commerce and Adobe I/O Events.
 * @param config - The configuration of the app, with commerce events.
 * @param context - The execution context for the events installation.
 */
async function createCommerceEvents(
  config: CommerceEventsConfig,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  logger.debug("Starting installation of Commerce Events with config:", config);

  // biome-ignore lint/suspicious/noEvolvingTypes: We want the type to be auto-inferred
  const stepData = [];

  const workspaceConfiguration = JSON.stringify(makeWorkspaceConfig(context));
  const existingIoEventsData = await getIoEventsExistingData(context);
  const commerceEventingExistingData =
    await getCommerceEventingExistingData(context);

  for (let i = 0; i < config.eventing.commerce.length; i++) {
    const { provider, events } = config.eventing.commerce[i];
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

    if (i === 0) {
      // The eventing module must be configured before creating the other entities, and only once.
      await configureCommerceEventing(
        {
          context,
          config: {
            enabled: true,
            merchant_id: context.appData.orgName,
            environment_id: context.appData.projectName,
            instance_id: providerData.instance_id,
            workspace_configuration: workspaceConfiguration,
          },
        },
        commerceEventingExistingData,
      );
    }

    const { commerceProvider, subscriptions } = await onboardCommerceEventing(
      {
        context,
        metadata: config.metadata,
        provider,
        ioData: {
          provider: providerData,
          events: eventsData,
          workspaceConfiguration,
        },
      },
      commerceEventingExistingData,
    );

    stepData.push({
      provider: {
        config: provider,
        data: {
          ioEvents: providerData,
          commerce: commerceProvider,
          events: eventsData.map(({ config, data }, index) => {
            return {
              config,
              data: {
                ...data,
                subscription: subscriptions[index],
              },
            };
          }),
        },
      },
    });
  }

  logger.debug("Completed Commerce Events installation step.");
  return stepData;
}
