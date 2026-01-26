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

import { definePhase } from "#management/installation/workflow/phase";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InferPhaseData } from "#management/installation/workflow/phase";

/** Config type when eventing is present. */
type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
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

/** Check if config has commerce event sources. */
function hasCommerceEvents(config: EventsConfig): boolean {
  return config.eventing.some((source) => source.type === "commerce");
}

/** The events installation phase with type-safe step chaining. */
export const eventsPhase = definePhase(
  {
    name: "events",
    when: (config): config is EventsConfig => config.eventing !== undefined,
    context: createEventsContext,
  },
  (steps) =>
    steps
      .step("providers", (s) =>
        s.run(async ({ phase, fail }) => {
          const result = await phase.ioEventsClient.createProvider();
          if (!result.id) {
            fail("PROVIDER_CREATION_FAILED", "No ID returned");
          }
          return { providerId: result.id, label: result.label };
        }),
      )
      .step("metadata", (s) =>
        s.run(async ({ phase, data }) => {
          // ✅ data.providers is typed as { providerId: string; label: string }
          console.log(
            "Provider ID from previous step:",
            data.providers.providerId,
          );
          const result = await phase.ioEventsClient.createMetadata();
          return { metadataId: result.id };
        }),
      )
      .step("registrations", (s) =>
        s.run(async ({ phase, data }) => {
          // ✅ data.metadata is also available and typed
          console.log("Metadata ID:", data.metadata.metadataId);
          const result = await phase.ioEventsClient.createRegistration();
          return { registrationId: result.id };
        }),
      )
      .step("commerceConfig", (s) =>
        s.when(hasCommerceEvents).run(async ({ phase }) => {
          await phase.commerceEventsClient.configure();
          return { commerceConfigured: true };
        }),
      )
      .step("commerceSubscriptions", (s) =>
        s.when(hasCommerceEvents).run(async ({ phase }) => {
          const result = await phase.commerceEventsClient.subscribe();
          return { subscriptionId: result.subscriptionId };
        }),
      ),
);

/** The accumulated output data type from the events phase. */
export type EventsPhaseData = InferPhaseData<typeof eventsPhase>;
