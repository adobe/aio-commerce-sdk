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

/** Error definitions map: error keys to their payload types. */
export type ErrorDefinitions = Record<string, unknown>;

/** Context available to all steps during execution. */
export type StepContext<
  TConfig,
  TPhaseCtx,
  TErrors extends ErrorDefinitions,
> = {
  /** The narrowed app configuration. */
  config: TConfig;

  /** Phase-specific context (API clients, etc.). */
  phase: TPhaseCtx;

  /** Accumulated data from previous steps, keyed by step name. */
  data: Record<string, unknown>;

  /** Fail the step with a typed error. */
  fail: <K extends keyof TErrors & string>(
    key: K,
    ...args: TErrors[K] extends undefined
      ? [message?: string]
      : [payload: TErrors[K], message?: string]
  ) => never;
};

/** A step definition within a phase. */
export type Step<
  TName extends string,
  TConfig,
  TPhaseCtx,
  TOutput,
  TErrors extends ErrorDefinitions,
> = {
  name: TName;
  when?: (config: TConfig) => boolean;

  run: (
    ctx: StepContext<TConfig, TPhaseCtx, TErrors>,
  ) => Promise<TOutput> | TOutput;
};

/** Phase definition. */
export type Phase<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx,
  _TOutput extends Record<string, unknown>,
  TErrors extends ErrorDefinitions = ErrorDefinitions,
> = {
  name: TName;
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;

  context?: () => TPhaseCtx | Promise<TPhaseCtx>;
  steps: Step<string, TConfig, TPhaseCtx, unknown, TErrors>[];
};
