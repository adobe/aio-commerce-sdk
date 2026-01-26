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

import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CommerceEvent, ExternalEvent } from "#config/schema/eventing";
import type { Phase } from "#management/installation/workflow/phase";

const PHASE_NAME = "events" as const;

/** Config type when eventing is present. */
type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

/** Error definitions for the events phase. */
type EventsErrors = {
  PROVIDER_CREATION_FAILED: { providerId: string; reason: string };
  METADATA_CREATION_FAILED: { eventType: string };
  REGISTRATION_FAILED: { registrationId: string };
};

/** Output data produced by the events phase. */
type EventsOutput = {
  providers: IoEventProvider[];
  metadata: IoEventMetadata[];
  registrations: IoEventRegistration[];

  commerce: {
    eventingConfigured: boolean;
    subscriptions: CommerceEventSubscription[];
    events: Array<
      CommerceEvent & {
        // Link all the IDs of this phase to the events in the configuration.
        registrationId: string;
        subscriptionId: string;
        metadataId: string;
        providerId: string;
      }
    >;
  };

  external: {
    events: Array<
      // Link all the IDs of this phase to the events in the configuration.
      ExternalEvent & {
        registrationId: string;
        metadataId: string;
        providerId: string;
      }
    >;
  };
};

/** Phase context with lazy-initialized API clients. */
function createEventsContext() {
  return {
    get ioEventsClient() {
      return {
        createProvider: () =>
          Promise.resolve({ id: "provider-1", label: "My Provider" }),
        createMetadata: () => Promise.resolve({ id: "meta-1" }),
        createRegistration: () => Promise.resolve({ id: "reg-1" }),
      };
    },
    get commerceEventsClient() {
      return {
        configure: () => Promise.resolve({ configured: true }),
        subscribe: () => Promise.resolve({ subscriptionId: "sub-1" }),
      };
    },
  };
}

type EventsContext = ReturnType<typeof createEventsContext>;

/** Check if config has commerce event sources. */
function hasCommerceEvents(config: EventsConfig): boolean {
  return config.eventing.some((source) => source.type === "commerce");
}

/** The events installation phase. */
export const eventsPhase: Phase<
  typeof PHASE_NAME,
  EventsConfig,
  EventsContext,
  EventsOutput,
  EventsErrors
> = {
  name: PHASE_NAME,
  when: (config): config is EventsConfig => config.eventing !== undefined,
  context: createEventsContext,

  steps: [
    {
      name: "providers",
      async run({ phase, fail }) {
        const result = await phase.ioEventsClient.createProvider();
        if (!result.id) {
          fail("PROVIDER_CREATION_FAILED", {
            providerId: "",
            reason: "No ID returned",
          });
        }
        return { providerId: result.id, label: result.label };
      },
    },
    {
      name: "metadata",
      async run({ phase, data }) {
        console.log("Provider ID from previous step:", data.providers);
        const result = await phase.ioEventsClient.createMetadata();
        return { metadataId: result.id };
      },
    },
    {
      name: "registrations",
      async run({ phase }) {
        const result = await phase.ioEventsClient.createRegistration();
        return { registrationId: result.id };
      },
    },
    {
      name: "commerceConfig",
      when: hasCommerceEvents,
      async run({ phase }) {
        await phase.commerceEventsClient.configure();
        return { commerceConfigured: true };
      },
    },
    {
      name: "commerceSubscriptions",
      when: hasCommerceEvents,
      async run({ phase }) {
        const result = await phase.commerceEventsClient.subscribe();
        return { subscriptionId: result.subscriptionId };
      },
    },
  ],
};
