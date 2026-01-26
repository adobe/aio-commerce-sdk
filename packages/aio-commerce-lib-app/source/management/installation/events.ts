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
  resolveCommerceHttpClientParams,
  resolveIoEventsHttpClientParams,
} from "@adobe/aio-commerce-lib-api";
import { createCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

import { definePhase } from "#management/installation/workflow/phase";

import type { CommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import type { AdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  InferPhaseData,
  PhaseContextFactory,
} from "#management/installation/workflow/phase";

/** Config type when eventing is present. */
type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

const PHASE_META = {
  label: "Events",
  description: "Sets up I/O Events and Commerce Events",
} as const;

const STEPS_META = {
  providers: {
    label: "Create Providers",
    description: "Creates I/O Events providers for the application",
  },
  metadata: {
    label: "Create Metadata",
    description: "Registers event metadata with I/O Events",
  },
  registrations: {
    label: "Create Registrations",
    description: "Creates event registrations linking providers to webhooks",
  },
  commerceConfig: {
    label: "Configure Commerce Events",
    description: "Configures Adobe Commerce to emit events",
  },
  commerceSubscriptions: {
    label: "Create Commerce Subscriptions",
    description: "Subscribes to Commerce events",
  },
} as const;

/** Context available to all steps in the events phase. */
interface EventsPhaseContext {
  get ioEventsClient(): AdobeIoEventsApiClient;
  get commerceEventsClient(): CommerceEventsApiClient;
}

/** Creates the events phase context with lazy-initialized API clients. */
const createEventsPhaseContext: PhaseContextFactory<EventsPhaseContext> = (
  installation,
) => {
  const { params } = installation;
  let ioEventsClient: AdobeIoEventsApiClient | null = null;
  let commerceEventsClient: CommerceEventsApiClient | null = null;

  return {
    get ioEventsClient() {
      if (ioEventsClient === null) {
        const ioEventsClientParams = resolveIoEventsHttpClientParams(params);
        ioEventsClient = createAdobeIoEventsApiClient(ioEventsClientParams);
      }

      return ioEventsClient;
    },

    get commerceEventsClient() {
      if (commerceEventsClient === null) {
        const commerceClientParams = resolveCommerceHttpClientParams(params);
        commerceEventsClient =
          createCommerceEventsApiClient(commerceClientParams);
      }

      return commerceEventsClient;
    },
  };
};

/** Check if config has commerce event sources. */
function hasCommerceEvents(config: EventsConfig): boolean {
  return config.eventing.some((source) => source.type === "commerce");
}

/** The events installation phase with type-safe step chaining. */
export const eventsPhase = definePhase(
  {
    name: "events",
    meta: PHASE_META,
    when: (config): config is EventsConfig => config.eventing !== undefined,
    context: createEventsPhaseContext,
  },
  (steps) =>
    steps
      .step("providers", STEPS_META.providers, (step) =>
        step.run(({ installationContext }) => {
          const { logger } = installationContext;
          logger.info("Creating I/O Events Providers...");

          return { providerId: "TODO", label: "TODO" };
        }),
      )
      .step("metadata", STEPS_META.metadata, (step) =>
        step.run(({ installationContext }) => {
          const { logger } = installationContext;
          logger.info("Creating I/O Event Metadata...");

          return { metadataId: "TODO" };
        }),
      )
      .step("registrations", STEPS_META.registrations, (step) =>
        step.run(({ installationContext }) => {
          const { logger } = installationContext;
          logger.info("Creating I/O Events Registrations...");

          return { registrationId: "TODO" };
        }),
      )
      .step("commerceConfig", STEPS_META.commerceConfig, (step) =>
        step.when(hasCommerceEvents).run(({ installationContext }) => {
          const { logger } = installationContext;
          logger.info("Configuring Commerce Eventing...");

          return { commerceConfigured: true };
        }),
      )
      .step("commerceSubscriptions", STEPS_META.commerceSubscriptions, (step) =>
        step.when(hasCommerceEvents).run(({ installationContext }) => {
          const { logger } = installationContext;
          logger.info("Creating Commerce Subscriptions...");

          return { subscriptionId: "TODO" };
        }),
      ),
);

/** The accumulated output data type from the events phase. */
export type EventsPhaseData = InferPhaseData<typeof eventsPhase>;
