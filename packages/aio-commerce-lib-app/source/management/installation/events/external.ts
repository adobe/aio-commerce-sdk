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

import { createMetadata, createProviders, createRegistrations } from "./steps";
import { createEventsPhaseContext, hasExternalEvents } from "./utils";

import type { InferPhaseOutput } from "#management/installation/workflow/phase";

const PHASE_META = {
  label: "External Events",
  description: "Sets up I/O Events for external event sources",
} as const;

const STEPS_META = {
  providers: {
    label: "Create Providers",
    description: "Creates I/O Events providers for external events",
  },
  metadata: {
    label: "Create Metadata",
    description: "Registers external event metadata with I/O Events",
  },
  registrations: {
    label: "Create Registrations",
    description:
      "Creates event registrations linking providers to runtime actions",
  },
} as const;

/** The phase for installing external event sources. */
export const externalEventsPhase = definePhase({
  name: "external-events",
  meta: PHASE_META,
  steps: STEPS_META,

  context: createEventsPhaseContext,
  when: hasExternalEvents,

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

    return { provider, metadata, registration };
  },
});

/** The output data of the External Events phase. */
export type ExternalEventsPhaseOutput = InferPhaseOutput<
  typeof externalEventsPhase
>;
