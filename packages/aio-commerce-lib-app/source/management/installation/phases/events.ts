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

import { definePhase } from "./define";

import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  IoEventMetadata,
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { EmptyObject } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CommerceEvent, ExternalEvent } from "#config/schema/eventing";
import type {
  PhaseDef,
  PhaseExecutors,
  StepDef,
  StepError,
} from "#management/installation/types";

/** The name of this phase. */
const EVENTS_PHASE_NAME = "events" as const;

/** The steps of the events phase (in the order they should be executed). */
const EVENTS_PHASE_STEPS = [
  "providers",
  "metadata",
  "registrations",
  "commerceConfig",
  "commerceSubscriptions",
] as const satisfies string[];

type WithProvider<TData> = TData & {
  providerId: string;
};

type WithMetadataAndProvider<TData> = WithProvider<TData> & {
  metadataId: string;
};

type WithMetadataProviderAndRegistration<TData> =
  WithMetadataAndProvider<TData> & {
    registrationId: string;
  };

/** Describes the step for installing event providers. */
type ProvidersStep = StepDef<
  {
    providers: Record<string, IoEventProvider>;
    commerceEvents: WithProvider<CommerceEvent>[];
    externalEvents: WithProvider<ExternalEvent>[];
  },
  | StepError<"CREATE_FAILED", { providerInstanceId: string }>
  | StepError<"GET_FAILED", { providerId: string }>
>;

/** Describes the step for installing event metadata. */
type MetadataStep = StepDef<
  {
    metadatas: Record<string, IoEventMetadata>;
    commerceEvents: WithMetadataAndProvider<CommerceEvent>[];
    externalEvents: WithMetadataAndProvider<ExternalEvent>[];
  },
  StepError<"PROVIDER_NOT_FOUND", { providerId: string }>
>;

/** Describes the step for installing event registrations. */
type RegistrationsStep = StepDef<
  {
    registrations: Record<string, IoEventRegistration>;
    commerceEvents: WithMetadataProviderAndRegistration<CommerceEvent>[];
    externalEvents: WithMetadataProviderAndRegistration<ExternalEvent>[];
  },
  StepError<"PROVIDER_NOT_FOUND", { providerId: string }>
>;

/** Describes the step for installing event commerce configuration. */
type CommerceConfigStep = StepDef<EmptyObject, never>;

/** Describes the step for installing event commerce subscriptions. */
type CommerceSubscriptionsStep = StepDef<{
  subscriptions: Record<string, CommerceEventSubscription>;
}>;

/** Describes the events installation phase.  */
export type EventsPhase = PhaseDef<
  typeof EVENTS_PHASE_NAME,
  typeof EVENTS_PHASE_STEPS,
  {
    providers: ProvidersStep;
    metadata: MetadataStep;
    registrations: RegistrationsStep;
    commerceConfig: CommerceConfigStep;
    commerceSubscriptions: CommerceSubscriptionsStep;
  }
>;

/** Config type for the events phase. At least one event source must be defined. */
export type EventsPhaseConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

const eventsPhaseExecutors: PhaseExecutors<EventsPhase, EventsPhaseConfig> = {
  providers: (config, { data, installationContext, helpers }) => {
    // data is empty as it is the first step.
    const { logger } = installationContext;
    logger.debug(config, data);

    const somethingGoesWrong = false;

    if (somethingGoesWrong) {
      return helpers.stepFailed("CREATE_FAILED", {
        message: "Something went wrong",
        providerInstanceId: "payload associated with CREATE_FAILED",
      });
    }

    return helpers.stepSuccess({
      providers: {},
      commerceEvents: [],
      externalEvents: [],
    });
  },

  metadata: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "providers", step
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({
      metadatas: {},
      commerceEvents: data.commerceEvents.map((prev) => ({
        ...prev,
        metadataId: "id",
      })),

      externalEvents: data.externalEvents.map((prev) => ({
        ...prev,
        metadataId: "id",
      })),
    });
  },

  registrations: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "metadata" and "providers" steps
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({
      registrations: {},
      commerceEvents: data.commerceEvents.map((prev) => ({
        ...prev,
        registrationId: "id",
      })),

      externalEvents: data.externalEvents.map((prev) => ({
        ...prev,
        registrationId: "id",
      })),
    });
  },

  commerceConfig: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "metadata", "providers", and "registrations" steps
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({});
  },

  commerceSubscriptions: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "metadata", "providers", "registrations", and "commerceConfig" steps
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({
      subscriptions: {},
    });
  },
};

/**
 * Type guard that checks if the config has event sources that need to be installed.
 * @param config - The config to check
 * @returns true if the config has at least one event source configured, false otherwise
 */
function hasEventSources(
  config: CommerceAppConfigOutputModel,
): config is EventsPhaseConfig {
  return config.eventing !== undefined;
}

/** The runner function that will run all the steps of the events phase */
export const eventsPhaseRunner = definePhase(
  EVENTS_PHASE_NAME,
  EVENTS_PHASE_STEPS,
  eventsPhaseExecutors,
  hasEventSources,
);
