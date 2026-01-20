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
import type { EventsPhase } from "#management/installation/phases/events";
import type {
  DataBefore,
  DataThrough,
  PhaseDef,
  StepDef,
  StepError,
} from "#management/types";

/** The different phases of the installation process. */
export type InstallationPhases = {
  events: EventsPhase;
};

/** Defines a type with the different phases of the installation process. */
export type InstallationPhase = keyof InstallationPhases;

/** Defines a type with the different steps of a phase in the installation process. */
export type InstallationPhaseStep<Phase extends InstallationPhase> =
  InstallationPhases[Phase]["order"][number];

/** Shorthand to get the step definition of the given step in the given phase. */
export type InstallationPhaseStepDef<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = InstallationPhases[Phase]["steps"][Step];

/** Defines a successful step result. */
export type StepSuccess<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = {
  success: true;
  data: InstallationPhaseStepDef<Phase, Step>["data"];
};

/** Defines a failed step result. */
export type StepFailure<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = {
  success: false;
  error: InstallationPhaseStepDef<Phase, Step>["errors"];
};

/** The result of a step execution. */
export type StepResult<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = StepSuccess<Phase, Step> | StepFailure<Phase, Step>;

/** What a step executor receives */
export type StepContext<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = {
  /** The phase of the installation */
  phase: Phase;

  /** The step of the installation */
  step: Step;

  /** The data we havez before this step */
  data: DataBefore<
    InstallationPhases[Phase]["order"],
    InstallationPhases[Phase]["steps"],
    Step
  >;

  /** Helpers for step execution */
  helpers: {
    /** Marks the step as successful */
    stepSuccess: (
      data: InstallationPhaseStepDef<Phase, Step>["data"],
    ) => StepResult<Phase, Step>;

    /** Marks the step as failed, with the given error key. */
    stepFailed: <
      ErrorKey extends InstallationPhaseStepDef<Phase, Step>["errors"]["key"],
    >(
      key: ErrorKey,
      error: Omit<
        Extract<
          InstallationPhaseStepDef<Phase, Step>["errors"],
          { key: ErrorKey }
        >,
        "key"
      >,
    ) => StepResult<Phase, Step>;
  };
};

/** An executor function for a step, receives a context and returns a step result. */
export type StepExecutor<
  Phase extends InstallationPhase,
  Step extends InstallationPhaseStep<Phase>,
> = (
  config: CommerceAppConfigOutputModel,
  ctx: StepContext<Phase, Step>,
) => Promise<StepResult<Phase, Step>>;

/** Registry of executors for a phase */
export type PhaseExecutors<Phase extends InstallationPhase> = {
  [Step in InstallationPhaseStep<Phase>]: StepExecutor<Phase, Step>;
};

/** All data from a completed phase (all steps through the last one) */
export type AllPhaseData<
  TPhase extends PhaseDef<
    string[],
    Record<string, StepDef<unknown, StepError<string>>>
  >,
> = DataThrough<TPhase["order"], TPhase["steps"], TPhase["order"][number]>;

/** The final data we have from running all the phases. */
export type AllPhasesData = {
  [P in InstallationPhase]: AllPhaseData<InstallationPhases[P]>;
}[InstallationPhase];
