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
import type { EmptyObject } from "type-fest";

/** Shared context available to all phases and steps during installation. */
export type InstallationContext = {
  params: Record<string, unknown>;
  logger: ReturnType<typeof AioLogger>;
};

/**
 * Error definition map: maps error keys to their payload types.
 * Use `void` for errors with no payload.
 */
export type ErrorDefinitions = Record<string, unknown>;

/** Runtime error shape for step failures. */
export type StepError<TPayload extends Record<string, unknown> = EmptyObject> =
  {
    key: string;
    message?: string;
    payload?: TPayload;
  };

/** The result of a step execution. */
export type StepResult<TData> =
  | { status: "success"; data: TData }
  | { status: "failed"; error: StepError };

/**
 * Helper utilities for step execution.
 * TErrorDefs maps error keys to their payload types.
 */
export type StepHelpers<TErrorDefs extends ErrorDefinitions> = {
  success: <T>(data: T) => StepResult<T>;
  failed: <K extends keyof TErrorDefs & string>(
    ...args: TErrorDefs[K] extends void
      ? [key: K, message?: string]
      : [key: K, payload: TErrorDefs[K], message?: string]
  ) => StepResult<never>;
};

/** Metadata for a phase or step. */
export type PhaseMeta = {
  /** Human-readable label for displaying in UIs. */
  label: string;

  /** Description of what this phase/step does. */
  description: string;
};

/** Metadata for a step within a phase. */
export type StepMeta = PhaseMeta;

/** A step definition returned by `planSteps`. */
export type StepDefinition = {
  /** Unique name of the step within the phase. */
  name: string;

  /** Metadata for the step. */
  meta: StepMeta;
};

/** Context passed to step executor functions. */
export type StepContext<
  TData,
  TPhaseCtx,
  TErrorDefs extends ErrorDefinitions,
> = {
  /** Accumulated data from previous steps. */
  data: TData;

  /** Phase-specific context (API clients, etc.). */
  phaseContext: TPhaseCtx;

  /** Shared installation context (params, logger, etc.). */
  installation: InstallationContext;

  /** Helper functions for returning success/failure. */
  helpers: StepHelpers<TErrorDefs>;
};

/** A step executor function. */
export type StepExecutor<
  TConfig,
  TData,
  TPhaseCtx,
  TOutput,
  TErrorDefs extends ErrorDefinitions,
> = (
  config: TConfig,
  ctx: StepContext<TData, TPhaseCtx, TErrorDefs>,
) => Promise<StepResult<TOutput>> | StepResult<TOutput>;

/**
 * The plan object passed to the phase handler.
 * Provides utilities for running steps and tracking progress.
 */
export type PhasePlan<
  TConfig,
  TData,
  TPhaseCtx,
  TErrorDefs extends ErrorDefinitions = ErrorDefinitions,
> = {
  /**
   * Run a step if it's in the plan.
   * Automatically handles skipping, progress tracking, and data accumulation.
   */
  run: <TOutput>(
    step: string,
    executor: StepExecutor<TConfig, TData, TPhaseCtx, TOutput, TErrorDefs>,
  ) => Promise<PhasePlan<TConfig, TData & TOutput, TPhaseCtx, TErrorDefs>>;
};
