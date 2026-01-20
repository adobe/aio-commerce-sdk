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

/** Defines an error that occurred during a step */
export type StepError<K extends string, Extra = EmptyObject> = {
  key: K;
  message?: string;
} & Extra;

/** Defines a step's own data and possible errors */
export type StepDef<TData, TErrors extends StepError<string> = never> = {
  data: TData;
  errors: TErrors | StepError<"UNEXPECTED_ERROR", { error: Error }>;
};

/** Placeholder for steps not yet defined */
export type UnknownStepDef = StepDef<unknown, never>;

/** Defines a map of steps definitions. */
export type StepRecord<TOrder extends string[]> = Record<
  TOrder[number],
  StepDef<unknown, StepError<string>>
>;

/** Defines a phase as a collection of steps with a specific order. */
export type PhaseDef<
  TOrder extends string[],
  TSteps extends StepRecord<TOrder>,
> = {
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

/** The state of a step at runtime, with cumulative data */
export type StepState<
  TPhase extends PhaseDef<
    string[],
    Record<string, StepDef<unknown, StepError<string>>>
  >,
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
      error: TPhase["steps"][TStep]["errors"];
    };

/** All possible states for all steps in a phase */
export type PhaseState<
  TPhase extends PhaseDef<
    string[],
    Record<string, StepDef<unknown, StepError<string>>>
  >,
> = {
  [S in TPhase["order"][number]]: { step: S } & StepState<TPhase, S>;
}[TPhase["order"][number]];
