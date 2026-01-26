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

import type { Merge, Simplify } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Error definitions map: error keys to their payload types. */
export type ErrorDefinitions = Record<string, unknown>;

/** Context available to a step during execution. */
export type StepContext<
  TConfig,
  TPhaseCtx,
  TData extends Record<string, unknown>,
  TErrors extends ErrorDefinitions,
> = {
  config: TConfig;
  phase: TPhaseCtx;
  data: TData;
  fail: <K extends keyof TErrors & string>(
    key: K,
    ...args: TErrors[K] extends undefined
      ? [message?: string]
      : [payload: TErrors[K], message?: string]
  ) => never;
};

/** Internal step representation. */
export type Step<
  TName extends string,
  TConfig,
  TPhaseCtx,
  TData extends Record<string, unknown>,
  TOutput,
  TErrors extends ErrorDefinitions,
> = {
  name: TName;
  when?: (config: TConfig) => boolean;
  run: (
    ctx: StepContext<TConfig, TPhaseCtx, TData, TErrors>,
  ) => Promise<TOutput> | TOutput;
};

// biome-ignore lint/suspicious/noExplicitAny: Internal type for runtime step storage
export type AnyStep = Step<string, any, any, any, any, any>;

/** Phase definition. */
export type Phase<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseCtx = unknown,
  TOutput extends Record<string, unknown> = Record<string, unknown>,
  TErrors extends ErrorDefinitions = ErrorDefinitions,
> = {
  name: TName;
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;
  context?: () => TPhaseCtx | Promise<TPhaseCtx>;
  steps: AnyStep[];
  _output?: TOutput;
  _errors?: TErrors;
};

/** Infer the output data type from a phase. */
export type InferPhaseData<TPhase> =
  TPhase extends Phase<
    string,
    CommerceAppConfigOutputModel,
    unknown,
    infer TOutput,
    ErrorDefinitions
  >
    ? Simplify<TOutput>
    : never;

/** Step builder for fluent API. */
class StepBuilder<
  TName extends string,
  TConfig,
  TPhaseCtx,
  TData extends Record<string, unknown>,
  TErrors extends ErrorDefinitions,
> {
  private _when?: (config: TConfig) => boolean;
  private readonly _name: TName;

  public constructor(name: TName) {
    this._name = name;
  }

  public when(predicate: (config: TConfig) => boolean): this {
    this._when = predicate;
    return this;
  }

  public run<TOutput>(
    fn: (
      ctx: StepContext<TConfig, TPhaseCtx, TData, TErrors>,
    ) => Promise<TOutput> | TOutput,
  ): BuiltStep<TName, TConfig, TPhaseCtx, TData, TOutput, TErrors> {
    return { name: this._name, when: this._when, run: fn };
  }
}

type BuiltStep<
  TName extends string,
  TConfig,
  TPhaseCtx,
  TData extends Record<string, unknown>,
  TOutput,
  TErrors extends ErrorDefinitions,
> = Step<TName, TConfig, TPhaseCtx, TData, TOutput, TErrors>;

/** Builder for chaining steps with accumulated type safety. */
class StepsBuilder<
  TConfig,
  TPhaseCtx,
  TData extends Record<string, unknown>,
  TErrors extends ErrorDefinitions,
> {
  private readonly _steps: AnyStep[] = [];

  public step<TName extends string, TOutput>(
    name: TName,
    configure: (
      s: StepBuilder<TName, TConfig, TPhaseCtx, TData, TErrors>,
    ) => BuiltStep<TName, TConfig, TPhaseCtx, TData, TOutput, TErrors>,
  ) {
    const builder = new StepBuilder<TName, TConfig, TPhaseCtx, TData, TErrors>(
      name,
    );
    const stepDef = configure(builder);
    this._steps.push(stepDef);

    return this as unknown as StepsBuilder<
      TConfig,
      TPhaseCtx,
      AddToData<TData, TName, TOutput>,
      TErrors
    >;
  }

  public build(): { steps: AnyStep[]; _data: TData } {
    return { steps: this._steps, _data: undefined as unknown as TData };
  }
}

type PhaseOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx,
  _TErrors extends ErrorDefinitions,
> = {
  name: TName;
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;
  context?: () => TPhaseCtx | Promise<TPhaseCtx>;
};

/**
 * Define a phase with type-safe step chaining.
 *
 * @example
 * const myPhase = definePhase(
 *   {
 *     name: "events",
 *     when: (cfg): cfg is EventsConfig => cfg.eventing !== undefined,
 *     context: () => ({ client: createClient() }),
 *   },
 *   (steps) => steps
 *     .step("providers", (s) => s.run(async ({ phase }) => {
 *       return { providerId: "abc" };
 *     }))
 *     .step("metadata", (s) => s.run(async ({ data }) => {
 *       // data.providers is typed!
 *       console.log(data.providers.providerId);
 *       return { metadataId: "xyz" };
 *     })),
 * );
 */
export function definePhase<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx,
  TErrors extends ErrorDefinitions,
  TData extends Record<string, unknown>,
>(
  options: PhaseOptions<TName, TConfig, TPhaseCtx, TErrors>,
  buildSteps: (
    steps: StepsBuilder<TConfig, TPhaseCtx, Record<string, never>, TErrors>,
  ) => StepsBuilder<TConfig, TPhaseCtx, TData, TErrors>,
): Phase<TName, TConfig, TPhaseCtx, TData, TErrors> {
  const stepsBuilder = new StepsBuilder<
    TConfig,
    TPhaseCtx,
    Record<string, never>,
    TErrors
  >();
  const result = buildSteps(stepsBuilder).build();
  return {
    name: options.name,
    when: options.when,
    context: options.context,
    steps: result.steps,
  };
}

/** Merges a new step output into the accumulated data type. */
type AddToData<
  TData extends Record<string, unknown>,
  TName extends string,
  TOutput,
> = Simplify<Merge<TData, Record<TName, TOutput>>>;
