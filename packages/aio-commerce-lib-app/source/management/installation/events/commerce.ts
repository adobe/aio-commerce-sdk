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

import {
  configureCommerce,
  createCommerceSubscriptions,
  createMetadata,
  createProviders,
  createRegistrations,
} from "./steps";
import { createEventsPhaseContext, hasCommerceEvents } from "./utils";

import type { InferPhaseOutput } from "#management/installation/workflow/phase";

const PHASE_META = {
  label: "Commerce Events",
  description: "Sets up I/O Events for Adobe Commerce event sources",
} as const;

const STEPS_META = {
  providers: {
    label: "Create Providers",
    description: "Creates I/O Events providers for Commerce events",
  },
  metadata: {
    label: "Create Metadata",
    description: "Registers Commerce event metadata with I/O Events",
  },
  registrations: {
    label: "Create Registrations",
    description:
      "Creates event registrations linking providers to runtime actions",
  },
  commerceConfig: {
    label: "Configure Commerce Eventing",
    description: "Configures Adobe Commerce instance to emit events",
  },
  commerceSubscriptions: {
    label: "Create Commerce Subscriptions",
    description: "Subscribes to Commerce events",
  },
} as const;

/** The phase for installing commerce event sources. */
export const commerceEventsPhase = definePhase({
  name: "commerce-events",
  meta: PHASE_META,
  steps: STEPS_META,

  context: createEventsPhaseContext,
  when: hasCommerceEvents,

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

    await run("commerceConfig", () =>
      configureCommerce(phaseContext, provider.providerId),
    );

    await run("commerceSubscriptions", () =>
      createCommerceSubscriptions(phaseContext, provider.providerId),
    );

    return { provider, metadata, registration };
  },
});

/** The output data of the Commerce Events phase. */
export type CommerceEventsPhaseOutput = InferPhaseOutput<
  typeof commerceEventsPhase
>;
