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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import { CommerceAppConfigSchema } from "#config/schema/app";

import { definePhase } from "./define";

import type { IoEventProvider } from "@adobe/aio-commerce-lib-events/io-events";
import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  PhaseDef,
  PhaseExecutors,
  StepDef,
  StepError,
  UnknownStepDef,
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

/** Describes the step for installing event providers. */
type ProvidersStep = StepDef<
  { providers: IoEventProvider[] },
  | StepError<"CREATE_FAILED", { providerInstanceId: string }>
  | StepError<"GET_FAILED", { providerId: string }>
>;

/** Describes the step for installing event metadata. */
type MetadataStep = UnknownStepDef;

/** Describes the step for installing event registrations. */
type RegistrationsStep = UnknownStepDef;

/** Describes the step for installing event commerce configuration. */
type CommerceConfigStep = UnknownStepDef;

/** Describes the step for installing event commerce subscriptions. */
type CommerceSubscriptionsStep = UnknownStepDef;

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

/** Config type for the events phase. Commerce events will be defined. */
export type EventsPhaseConfig = SetRequiredDeep<
  CommerceAppConfigOutputModel,
  "eventing" | "eventing.commerce"
>;

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
      providers: [],
    });
  },

  metadata: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "providers", step
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({});
  },

  registrations: (config, { data, installationContext, helpers }) => {
    // data contains the output of the previous "metadata" and "providers" steps
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({});
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

    return helpers.stepSuccess({});
  },
};

// Extends the default config schema with an additional check that allows to
// verify if the eventing configuration is in-place for this phase.
const HasCommerceEventsSchema = v.pipe(
  CommerceAppConfigSchema,
  v.check((config) => {
    return (
      config.eventing !== undefined &&
      config.eventing.commerce !== undefined &&
      config.eventing.commerce.length > 0
    );
  }),
);

/**
 * Type assert that verifies that the given config has commerce events that need to be installed.
 * @param config - The broad config to verify
 */
function assertHasCommerceEvents(
  config: CommerceAppConfigOutputModel,
): asserts config is EventsPhaseConfig {
  const result = v.safeParse(HasCommerceEventsSchema, config);

  if (!result.success) {
    throw new CommerceSdkValidationError(
      "Invalid commerce eventing configuration",
      {
        issues: result.issues,
      },
    );
  }
}

/** The runner function that will run all the steps of the events phase */
export const eventsPhaseRunner = definePhase(
  EVENTS_PHASE_NAME,
  EVENTS_PHASE_STEPS,
  eventsPhaseExecutors,
  assertHasCommerceEvents,
);
