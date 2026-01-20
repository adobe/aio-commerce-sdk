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

import type { EmptyObject, Simplify } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

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
  TSteps extends Record<string, StepDef<unknown, StepError<string>>>,
  Target extends string,
  Acc = EmptyObject,
> = TOrder extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends Target
    ? Acc
    : DataBefore<Tail, TSteps, Target, Acc & TSteps[Head]["data"]>
  : Acc;

/**
 * This type is a bit complex, as it uses recursion and conditionals, but is essentially
 * telling TypeScript to accumulate data from steps up to the target step (inclusive).
 */
export type DataThrough<
  TOrder extends readonly string[],
  TSteps extends Record<string, StepDef<unknown, StepError<string>>>,
  Target extends string,
  Acc = EmptyObject,
> = TOrder extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? Head extends Target
    ? Acc & TSteps[Head]["data"]
    : DataThrough<Tail, TSteps, Target, Acc & TSteps[Head]["data"]>
  : Acc;

type GenericPhaseDef = PhaseDef<
  string,
  readonly string[],
  Record<string, StepDef<unknown, StepError<string>>>
>;

/** The state of a step at runtime, with cumulative data */
export type StepState<
  TPhase extends GenericPhaseDef,
  TStep extends TPhase["order"][number],
> =
  | {
      status: "pending";
      data: Simplify<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "started";
      data: Simplify<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "completed";
      data: Simplify<DataThrough<TPhase["order"], TPhase["steps"], TStep>>;
    }
  | {
      status: "failed";
      data: Simplify<DataBefore<TPhase["order"], TPhase["steps"], TStep>>;
      error: TPhase["steps"][TStep]["error"];
    };

export type StepSuccess<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = {
  success: true;
  data: Phase["steps"][Step]["data"];
};

export type StepFailure<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = {
  success: false;
  error: Phase["steps"][Step]["error"];
};

export type StepResult<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = StepSuccess<Phase, Step> | StepFailure<Phase, Step>;

export type StepContext<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = {
  /** The current phase the step belongs to. */
  phase: Phase["name"];

  /** The current step name. */
  step: Step;

  /** The data we have accumulated before this step */
  data: DataBefore<Phase["order"], Phase["steps"], Step>;

  /** Helpers for step execution */
  helpers: {
    /** Marks the step as successful */
    stepSuccess: (
      data: Phase["steps"][Step]["data"],
    ) => StepResult<Phase, Step>;

    /** Marks the step as failed, with the given error key. */
    stepFailed: <ErrorKey extends Phase["steps"][Step]["error"]["key"]>(
      key: ErrorKey,
      error: Omit<
        Extract<Phase["steps"][Step]["error"], { key: ErrorKey }>,
        "key"
      >,
    ) => StepResult<Phase, Step>;
  };
};

export type StepExecutor<
  Phase extends GenericPhaseDef,
  Step extends Phase["order"][number],
> = (
  config: CommerceAppConfigOutputModel,
  ctx: StepContext<Phase, Step>,
) => Promise<StepResult<Phase, Step>> | StepResult<Phase, Step>;

export type PhaseExecutors<Phase extends GenericPhaseDef> = {
  [Step in Phase["order"][number]]: StepExecutor<Phase, Step>;
};

/** All possible states for all steps in a phase */
export type PhaseState<TPhase extends GenericPhaseDef> = {
  [S in TPhase["order"][number]]: { step: S } & StepState<TPhase, S>;
}[TPhase["order"][number]];

/** All data from a completed phase (all steps through the last one) */
export type AllPhaseData<Phase extends GenericPhaseDef> = DataThrough<
  Phase["order"],
  Phase["steps"],
  Phase["order"][number]
>;

/** Union of all possible step failures for a phase */
export type PhaseFailure<Phase extends GenericPhaseDef> = {
  [Step in Phase["order"][number]]: {
    status: "failed";
    step: Step;
    error: Phase["steps"][Step]["error"];
  };
}[Phase["order"][number]];

/** Result of running a phase */
export type PhaseResult<Phase extends GenericPhaseDef> =
  | { status: "completed"; data: Simplify<AllPhaseData<Phase>> }
  | PhaseFailure<Phase>;
