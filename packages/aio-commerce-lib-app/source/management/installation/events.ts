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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  InferPhaseData,
  PhaseDefinition,
} from "#management/installation/workflow/phase";
import type { StepDefinition } from "#management/installation/workflow/types";

type EventsPhaseConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

/** Error definitions for the events phase. Maps error keys to their payloads. */
type EventsPhaseErrors = {
  PROVIDER_CREATION_FAILED: { providerId: string };
};

/** Returns true if the given app config contains eventing data. */
function hasEventSources(
  config: CommerceAppConfigOutputModel,
): config is EventsPhaseConfig {
  return config.eventing !== undefined;
}

/** Tells whether the given eventing configuration has commerce events. */
function hasCommerceEvents(config: EventsPhaseConfig): boolean {
  return config.eventing.some((source) => source.type === "commerce");
}

/** Creates the phase context with lazy-initialized API clients. */
function createEventsPhaseContext() {
  return {
    get ioEventsClient() {
      // Lazy init - would create the real client here
      return { createProvider: () => Promise.resolve({ id: "provider-1" }) };
    },
    get commerceEventsClient() {
      // Lazy init - would create the real client here
      return { subscribe: () => Promise.resolve({ subscriptionId: "sub-1" }) };
    },
  };
}

/** The phase context type. */
type EventsPhaseContext = ReturnType<typeof createEventsPhaseContext>;

/** Phase metadata. */
const PHASE_META = {
  label: "Eventing Configuration",
  description:
    "Sets up eventing infrastructure (providers, metadata, registrations)",
} as const;

/** Step definitions. */
const STEPS = {
  providers: {
    name: "providers",
    meta: {
      label: "Create Providers",
      description: "Create the event providers in Adobe I/O",
    },
  },
  metadata: {
    name: "metadata",
    meta: {
      label: "Create Metadata",
      description: "Create the metadata of each event to be installed",
    },
  },
  registrations: {
    name: "registrations",
    meta: {
      label: "Create Registrations",
      description: "Bind the events to their specified runtime actions",
    },
  },
  commerceConfig: {
    name: "commerceConfig",
    meta: {
      label: "Configure Commerce Events",
      description: "Set up commerce eventing",
    },
  },
  commerceSubscriptions: {
    name: "commerceSubscriptions",
    meta: {
      label: "Create Commerce Subscriptions",
      description: "Subscribe the app events to Adobe Commerce",
    },
  },
} as const satisfies Record<string, StepDefinition>;

/** The phase to install the eventing infrastructure of an app. */
export const eventsPhase = {
  name: "events",
  meta: PHASE_META,

  when: hasEventSources,
  context: createEventsPhaseContext,

  planSteps(config) {
    const steps: StepDefinition[] = [
      STEPS.providers,
      STEPS.metadata,
      STEPS.registrations,
    ];

    if (hasCommerceEvents(config)) {
      steps.push(STEPS.commerceConfig, STEPS.commerceSubscriptions);
    }

    return steps;
  },

  async handler(_config, installation, plan) {
    const { logger } = installation;

    let p = plan;

    p = await p.run("providers", async (_cfg, { phaseContext, helpers }) => {
      logger.debug("Creating event providers...");
      const provider = await phaseContext.ioEventsClient.createProvider();
      return helpers.success({ providerId: provider.id });
    });

    p = await p.run("metadata", (_cfg, { helpers }) => {
      logger.debug("Creating event metadata...");
      return helpers.success({ metadataCreated: true });
    });

    p = await p.run("registrations", (_cfg, { helpers }) => {
      logger.debug("Creating event registrations...");
      return helpers.success({ registrationsCreated: true });
    });

    p = await p.run("commerceConfig", (_cfg, { helpers }) => {
      logger.debug("Configuring commerce events...");
      return helpers.success({ commerceConfigured: true });
    });

    p = await p.run(
      "commerceSubscriptions",
      async (_cfg, { phaseContext, helpers }) => {
        logger.debug("Creating commerce subscriptions...");
        const sub = await phaseContext.commerceEventsClient.subscribe();
        return helpers.success({ subscriptionId: sub.subscriptionId });
      },
    );

    return p;
  },
} as const satisfies PhaseDefinition<
  EventsPhaseConfig,
  EventsPhaseContext,
  EventsPhaseErrors
>;

/** The output data of the events phase. */
export type EventsPhaseData = InferPhaseData<typeof eventsPhase>;
