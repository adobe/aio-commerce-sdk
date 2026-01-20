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

import { definePhase } from "../runner";

import type { IoEventProvider } from "@adobe/aio-commerce-lib-events/io-events";
import type { PhaseExecutors } from "#management/installation/types";
import type {
  PhaseDef,
  StepDef,
  StepError,
  UnknownStepDef,
} from "#management/types";

/** The steps of the events phase (in the order they should be executed). */
const EVENT_PHASE_STEPS = [
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

/** Describes the event installation phase.  */
export type EventsPhase = PhaseDef<
  typeof EVENT_PHASE_STEPS,
  {
    providers: ProvidersStep;
    metadata: MetadataStep;
    registrations: RegistrationsStep;
    commerceConfig: CommerceConfigStep;
    commerceSubscriptions: CommerceSubscriptionsStep;
  }
>;

/** The registry of executors for the events phase */
const eventPhaseExecutors: PhaseExecutors<"events"> = {
  providers: async (config, { data, helpers }) => {
    // data is empty as it is the first step.
    console.log(config, data);
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

  metadata: async (config, { data, helpers }) => {
    // data contains the output of the previous "providers", step
    console.log(config, data);
    return helpers.stepSuccess({});
  },

  registrations: async (config, { data, helpers }) => {
    // data contains the output of the previous "metadata" and "providers" steps
    console.log(config, data);
    return helpers.stepSuccess({});
  },

  commerceConfig: async (config, { data, helpers }) => {
    // data contains the output of the previous "metadata", "providers", and "registrations" steps
    console.log(config, data);
    return helpers.stepSuccess({});
  },

  commerceSubscriptions: async (config, { data, helpers }) => {
    // data contains the output of the previous "metadata", "providers", "registrations", and "commerceConfig" steps
    console.log(config, data);
    return helpers.stepSuccess({});
  },
};

/** Defines the event installation phase. */
export const eventPhaseRunner = definePhase(
  "events",
  EVENT_PHASE_STEPS,
  eventPhaseExecutors,
);
