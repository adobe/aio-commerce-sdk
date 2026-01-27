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
  InferPhaseOutput,
  PhaseContextFactory,
} from "#management/installation/workflow/phase";

type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

function hasCommerceEvents(config: CommerceAppConfigOutputModel): boolean {
  return config.eventing?.some((source) => source.type === "commerce") ?? false;
}

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
    when: hasCommerceEvents,
  },
  commerceSubscriptions: {
    label: "Create Commerce Subscriptions",
    description: "Subscribes to Commerce events",
    when: hasCommerceEvents,
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

function createProviders(_ctx: EventsPhaseContext, _config: EventsConfig) {
  return { providerId: "TODO", label: "TODO" };
}

function createMetadata(_ctx: EventsPhaseContext, _providerId: string) {
  return { metadataId: "TODO" };
}

function createRegistrations(
  _ctx: EventsPhaseContext,
  _providerId: string,
  _metadataId: string,
) {
  return { registrationId: "TODO" };
}

function configureCommerce(_ctx: EventsPhaseContext, _providerId: string) {
  return { commerceConfigured: true };
}

function createCommerceSubscriptions(
  _ctx: EventsPhaseContext,
  _providerId: string,
) {
  return { subscriptionId: "TODO" };
}

export const eventsPhase = definePhase({
  name: "events",
  meta: PHASE_META,
  steps: STEPS_META,

  context: createEventsPhaseContext,
  when: (config): config is EventsConfig => config.eventing !== undefined,

  run: async ({ config, phaseContext, run }) => {
    const provider = await run("providers", () =>
      createProviders(phaseContext, config),
    );

    const metadata = await run("metadata", () =>
      createMetadata(phaseContext, provider.providerId),
    );

    const registration = await run("registrations", () =>
      createRegistrations(
        phaseContext,
        provider.providerId,
        metadata.metadataId,
      ),
    );

    if (hasCommerceEvents(config)) {
      await run("commerceConfig", () =>
        configureCommerce(phaseContext, provider.providerId),
      );

      await run("commerceSubscriptions", () =>
        createCommerceSubscriptions(phaseContext, provider.providerId),
      );
    }

    return { provider, metadata, registration };
  },
});

/** The output type from the events phase. */
export type EventsPhaseOutput = InferPhaseOutput<typeof eventsPhase>;
