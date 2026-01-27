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
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Shared context available to all phases during installation. */
export type InstallationContext = {
  /** The raw action parameters from the App Builder runtime action. */
  params: Record<string, unknown>;

  /** Logger instance for installation logging. */
  logger: ReturnType<typeof AioLogger>;
};

/** Metadata for a step. */
export type StepMeta = {
  label: string;
  description: string;
};

/** Step declaration with optional condition. */
export type StepDeclaration = StepMeta & {
  /** Optional condition to determine if this step should be included in the plan. */
  when?: (config: CommerceAppConfigOutputModel) => boolean;
};

/** Metadata for a phase. */
export type PhaseMeta = {
  label: string;
  description: string;
};

/** Factory function type for creating phase context. */
export type PhaseContextFactory<TPhaseCtx> = (
  installation: InstallationContext,
) => TPhaseCtx | Promise<TPhaseCtx>;

/**
 * Function to execute a step with automatic state management.
 * Marks step as in-progress, executes the function, then marks as succeeded/failed.
 */
export type StepRunner<TSteps extends Record<string, StepDeclaration>> = <T>(
  stepName: keyof TSteps & string,
  fn: () => T | Promise<T>,
) => Promise<T>;

/** The execution context of phase. */
export type ExecutionContext<
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseCtx = EmptyObject,
> = InstallationContext &
  TPhaseCtx & {
    /** The narrowed app configuration. */
    config: TConfig;
  };

/** Context provided to the phase run handler. */
export type PhaseRunContext<
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx = EmptyObject,
  TSteps extends Record<string, StepDeclaration> = EmptyObject,
> = {
  /** Shared execution context */
  context: ExecutionContext<TConfig, TPhaseCtx>;

  /**
   * Execute a step with automatic state management.
   * @param stepName - Must be a key from the steps declaration.
   * @param fn - The function to execute for this step.
   */
  run: StepRunner<TSteps>;
};

/** Phase definition with static steps and a run handler. */
export type Phase<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TPhaseCtx = EmptyObject,
  TSteps extends Record<string, StepDeclaration> = EmptyObject,
  TOutput = unknown,
> = {
  name: TName;
  meta: PhaseMeta;
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;
  context?: PhaseContextFactory<TPhaseCtx>;
  steps: TSteps;
  run: (
    ctx: PhaseRunContext<TConfig, TPhaseCtx, TSteps>,
  ) => TOutput | Promise<TOutput>;
};

// biome-ignore lint/suspicious/noExplicitAny: Internal type for runtime phase storage
export type AnyPhase = Phase<string, any, any, any, any>;

/** Infer the output type from a phase. */
export type InferPhaseOutput<TPhase> =
  TPhase extends Phase<
    infer _TName,
    infer _TConfig,
    infer _Ctx,
    infer _Steps,
    infer TOutput
  >
    ? Awaited<TOutput>
    : never;

/** Options for defining a phase. */
export type PhaseOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx,
  TSteps extends Record<string, StepDeclaration>,
  TOutput,
> = {
  /** Unique name for the phase. */
  name: TName;

  /** Metadata for UI display. */
  meta: PhaseMeta;

  /** Condition to determine if this phase applies to the given config. */
  when: (config: CommerceAppConfigOutputModel) => config is TConfig;

  /** Optional factory to create phase-specific context (API clients, etc.). */
  context?: PhaseContextFactory<TPhaseCtx>;

  /** Static step declarations for plan generation. */
  steps: TSteps;

  /** The phase handler that orchestrates step execution. */
  run: (
    ctx: PhaseRunContext<TConfig, TPhaseCtx, TSteps>,
  ) => TOutput | Promise<TOutput>;
};

/**
 * Define a phase with static step declarations and a run handler.
 *
 * @example
 * ```typescript
 * const eventsPhase = definePhase({
 *   name: "events",
 *   meta: { label: "Events", description: "Sets up I/O Events" },
 *   when: (config): config is EventsConfig => config.eventing !== undefined,
 *   context: createEventsPhaseContext,
 *
 *   steps: {
 *     providers: { label: "Create Providers" },
 *     metadata: { label: "Create Metadata" },
 *     commerceConfig: { label: "Configure Commerce", when: hasCommerceEvents },
 *   },
 *
 *   run: async ({ config, phaseContext, run }) => {
 *     const provider = await run("providers", () =>
 *       createProviders(phaseContext, config)
 *     );
 *
 *     const metadata = await run("metadata", () =>
 *       createMetadata(phaseContext, provider.providerId)
 *     );
 *
 *     if (hasCommerceEvents(config)) {
 *       await run("commerceConfig", () =>
 *         configureCommerce(phaseContext, provider.providerId)
 *       );
 *     }
 *
 *     return { provider, metadata };
 *   },
 * });
 * ```
 */
export function definePhase<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TPhaseCtx,
  TSteps extends Record<string, StepDeclaration>,
  TOutput,
>(
  options: PhaseOptions<TName, TConfig, TPhaseCtx, TSteps, TOutput>,
): Phase<TName, TConfig, TPhaseCtx, TSteps, TOutput> {
  return {
    name: options.name,
    meta: options.meta,
    when: options.when,
    context: options.context,
    steps: options.steps,
    run: options.run,
  };
}
