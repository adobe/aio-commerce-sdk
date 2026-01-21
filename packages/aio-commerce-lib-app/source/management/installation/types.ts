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

import type AioLogger from "@adobe/aio-lib-core-logging";
import type { EmptyObject, MergeDeep, SimplifyDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Shared context available to all phases and steps during installation. */
export type InstallationContext = {
  /** The raw action parameters from the App Builder runtime action. */
  params: Record<string, unknown>;

  /** Logger instance for installation logging. */
  logger: ReturnType<typeof AioLogger>;
};

/** Defines an error that occurred during a step */
export type StepError<K extends string, Extra = EmptyObject> = {
  key: K;
  message?: string;
} & Extra;

/** Defines a step's own data and possible errors */
export type StepDef<TData, TError extends StepError<string> = never> = {
  data: TData;
  error: TError | StepError<"UNEXPECTED_ERROR", { error: Error }>;
};

/** Placeholder for steps not yet defined */
export type UnknownStepDef = StepDef<unknown, never>;

/** Defines a map of steps definitions. */
export type StepRecord<TOrder extends readonly string[]> = Record<
  TOrder[number],
  StepDef<unknown, StepError<string>>
>;

/** Defines a phase as a collection of steps with a specific order. */
export type PhaseDef<
  TName extends string,
  TOrder extends readonly string[],
  TSteps extends Record<TOrder[number], StepDef<unknown, StepError<string>>>,
> = {
  name: TName;
  order: TOrder;
  steps: TSteps;
};

/**
 * This type is a bit complex, as it uses recursion and conditionals, but is essentially
 * telling TypeScript to accumulate data from steps before the target step (exclusive).
 */
export type DataBefore<
  TOrder extends readonly string[],
  TSteps extends StepRecord<TOrder>,
  Target extends string,
  Acc = EmptyObject,
> = TOrder extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends Target
    ? Acc
    : DataBefore<Tail, TSteps, Target, MergeDeep<Acc, TSteps[Head]["data"]>>
  : Acc;

/**
 * This type is a bit complex, as it uses recursion and conditionals, but is essentially
 * telling TypeScript to accumulate data from steps up to the target step (inclusive).
 */
export type DataThrough<
  TOrder extends readonly string[],
  TSteps extends StepRecord<TOrder>,
  Target extends string,
  Acc = EmptyObject,
> = TOrder extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends Target
    ? Acc & TSteps[Head]["data"]
    : DataThrough<Tail, TSteps, Target, MergeDeep<Acc, TSteps[Head]["data"]>>
  : Acc;

/** Shorthand for a "wildcard" phase definition. */
export type GenericPhaseDef = PhaseDef<
  string,
  readonly string[],
  Record<string, StepDef<unknown, StepError<string>>>
>;

/**
 * A factory function that creates the phase context for a given step.
 * This is called before the step executes and the result is passed to the step.
 * If not provided, defaults to an empty object.
 */
export type PhaseContextFactory<
  TPhaseContext,
  Phase extends GenericPhaseDef = GenericPhaseDef,
  Step extends Phase["order"][number] = Phase["order"][number],
> = (
  step: Step,
  data: SimplifyDeep<DataBefore<Phase["order"], Phase["steps"], Step>>,
  installationContext: InstallationContext,
) => TPhaseContext | Promise<TPhaseContext>;

/** The state of a step at runtime, with cumulative data */
export type StepState<
  TPhase extends GenericPhaseDef,
  TStep extends TPhase["order"][number],
> =
  | {
      status: "pending";
      data: SimplifyDeep<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "started";
      data: SimplifyDeep<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "succeeded";
      data: SimplifyDeep<DataThrough<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "failed";
      data: SimplifyDeep<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
      error: TPhase["steps"][TStep]["error"];
    };

/** Defines a success result of a step execution. */
export type StepSuccess<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = {
  success: true;
  data: Phase["steps"][Step]["data"];
};

/** Defines a failure result of a step execution. */
export type StepFailure<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = {
  success: false;
  error: Phase["steps"][Step]["error"];
};

/** Defines the result of a step execution. */
export type StepResult<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = StepSuccess<Phase, Step> | StepFailure<Phase, Step>;

/** The context received by a step when it's being executed. */
export type StepContext<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
  TPhaseContext = EmptyObject,
> = {
  /** The current phase the step belongs to. */
  phase: Phase["name"];

  /** The current step name. */
  step: Step;

  /** The data we have accumulated before this step */
  data: SimplifyDeep<DataBefore<Phase["order"], Phase["steps"], Step>>;

  /** The shared installation context. */
  installationContext: InstallationContext;

  /** Phase-specific context created before the step runs. */
  phaseContext: TPhaseContext;

  /** Helpers for step execution */
  helpers: {
    /** Marks the step as successful */
    stepSuccess: (
      data: Phase["steps"][Step]["data"],
    ) => StepSuccess<Phase, Step>;

    /** Marks the step as failed, with the given error key. */
    stepFailed: <ErrorKey extends Phase["steps"][Step]["error"]["key"]>(
      key: ErrorKey,
      error: Omit<
        Extract<Phase["steps"][Step]["error"], { key: ErrorKey }>,
        "key"
      >,
    ) => StepFailure<Phase, Step>;
  };
};

/** The signature of a step execution handler.  */
export type StepExecutor<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseContext = EmptyObject,
> = (
  config: TConfig,
  ctx: StepContext<Phase, Step, TPhaseContext>,
) => Promise<StepResult<Phase, Step>> | StepResult<Phase, Step>;

/** Maps all the steps of the given phase to its step executors. */
export type PhaseExecutors<
  Phase extends GenericPhaseDef,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseContext = EmptyObject,
> = {
  [Step in Phase["order"][number]]: StepExecutor<
    Phase,
    Step,
    TConfig,
    TPhaseContext
  >;
};

/** Maps all the steps of the given phase to it's accumulated state. */
export type PhaseState<TPhase extends GenericPhaseDef = GenericPhaseDef> = {
  [S in TPhase["order"][number]]: { step: S } & StepState<TPhase, S>;
}[TPhase["order"][number]];

/** All data from a completed phase (all steps through the last one) */
export type AllPhaseData<Phase extends GenericPhaseDef = GenericPhaseDef> =
  DataThrough<Phase["order"], Phase["steps"], Phase["order"][number]>;

/** Defines a failure result for a phase execution. */
export type PhaseFailure<Phase extends GenericPhaseDef = GenericPhaseDef> = {
  [Step in Phase["order"][number]]: {
    status: "failed";
    step: Step;
    error: Phase["steps"][Step]["error"];
  };
}[Phase["order"][number]];

/** Defines a success result for a phase execution. */
export type PhaseSuccess<Phase extends GenericPhaseDef = GenericPhaseDef> = {
  status: "completed";
  data: SimplifyDeep<AllPhaseData<Phase>>;
};

/** Defines a skipped result for a phase execution (when config is not applicable). */
export type PhaseSkipped = {
  status: "skipped";
  reason?: string;
};

/** Defines the result of a phase execution. */
export type PhaseResult<Phase extends GenericPhaseDef = GenericPhaseDef> =
  | PhaseSuccess<Phase>
  | PhaseFailure<Phase>
  | PhaseSkipped;

/** Defines a function that runs a phase. */
export type PhaseRunner<Phase extends GenericPhaseDef = GenericPhaseDef> = (
  config: CommerceAppConfigOutputModel,
  ctx: InstallationContext,
) => Promise<PhaseResult<Phase>>;
