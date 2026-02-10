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

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type AioLogger from "@adobe/aio-lib-core-logging";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Shared context available to all steps during installation. */
export type InstallationContext = {
  /** The credentials of the app being installed */
  appCredentials: {
    clientId: string;
    consumerOrgId: string;
    projectId: string;
    workspaceId: string;
  };

  /** The raw action parameters from the App Builder runtime action. */
  params: RuntimeActionParams;

  /** Logger instance for installation logging. */
  logger: ReturnType<typeof AioLogger>;
};

/** Factory function type for creating step-specific context. */
export type StepContextFactory<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = (context: InstallationContext) => TStepCtx | Promise<TStepCtx>;

/** The execution context passed to leaf step run handlers. */
export type ExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = InstallationContext & TStepCtx;

/** Metadata for a step (used for UI display). */
export type StepMeta = {
  label: string;
  description?: string;
};

/** Defines the base properties of a step. */
export type StepBase<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
> = {
  /** The name of this step. */
  name: TName;

  /** Metadata associated with the step. */
  meta: StepMeta;

  /** Whether the step should be taken into consideration. */
  when?: (config: CommerceAppConfigOutputModel) => config is TConfig;
};

/** A leaf step that executes work (no children). */
export type LeafStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> = StepBase<TName, TConfig> & {
  type: "leaf";

  /** The execution handler for the step. */
  run: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => TOutput | Promise<TOutput>;
};

/** A branch step that contains children (no execution). */
export type BranchStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = StepBase<TName, TConfig> & {
  type: "branch";

  /** An optional factory function to setup shared context for the children steps. */
  context?: StepContextFactory<TStepCtx>;

  /** The children steps of this branch. */
  children: AnyStep[];
};

/** A step in the installation tree (discriminated union by `type`). */
export type Step<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> =
  | LeafStep<TName, TConfig, TStepCtx, TOutput>
  | BranchStep<TName, TConfig, TStepCtx>;

/** Loosely-typed step for use in non type-safe contexts. */
export interface AnyStep {
  type: "leaf" | "branch";
  name: string;
  meta: StepMeta;

  when?: (config: CommerceAppConfigOutputModel) => boolean;
  children?: AnyStep[];

  // biome-ignore-start lint/suspicious/noExplicitAny: We need the flexibility here
  context?: (context: InstallationContext) => any;
  run?: (config: any, context: any) => unknown | Promise<unknown>;
  // biome-ignore-end lint/suspicious/noExplicitAny: We no longer need the flexibility
}

/** Check if a step is a leaf step. */
export function isLeafStep(step: AnyStep): step is LeafStep {
  return step.type === "leaf";
}

/** Check if a step is a branch step. */
export function isBranchStep(step: AnyStep): step is BranchStep {
  return step.type === "branch";
}

/** Options for defining a leaf step. */
export type LeafStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> = Omit<LeafStep<TName, TConfig, TStepCtx, TOutput>, "type">;

/** Options for defining a branch step. */
export type BranchStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = Omit<BranchStep<TName, TConfig, TStepCtx>, "type">;

/**
 * Define a leaf step (executable, no children).
 *
 * @example
 * ```typescript
 * const createProviders = defineLeafStep({
 *   name: "providers",
 *   meta: { label: "Create Providers", description: "Creates I/O Events providers" },
 *   run: async ({ config, stepContext }) => {
 *     const { eventsClient } = stepContext;
 *     return eventsClient.createProvider(config.eventing);
 *   },
 * });
 * ```
 */
export function defineLeafStep<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
>(
  options: LeafStepOptions<TName, TConfig, TStepCtx, TOutput>,
): LeafStep<TName, TConfig, TStepCtx, TOutput> {
  return {
    type: "leaf",
    name: options.name,
    meta: options.meta,
    when: options.when,
    run: options.run,
  };
}

/**
 * Define a branch step (container with children, no runner).
 *
 * @example
 * ```typescript
 * const eventing = defineBranchStep({
 *   name: "eventing",
 *   meta: { label: "Eventing", description: "Sets up I/O Events" },
 *   when: hasEventing,
 *   context: async (ctx) => ({ eventsClient: await createEventsClient(ctx) }),
 *   children: [commerceEventsStep, externalEventsStep],
 * });
 * ```
 */
export function defineBranchStep<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
>(
  options: BranchStepOptions<TName, TConfig, TStepCtx>,
): BranchStep<TName, TConfig, TStepCtx> {
  return {
    type: "branch",
    name: options.name,
    meta: options.meta,
    when: options.when,
    context: options.context,
    children: options.children,
  };
}

/** Infer the output type from a leaf step. */
export type InferStepOutput<TStep> =
  TStep extends LeafStep<
    infer _TName,
    infer _TConfig,
    infer _TStepCtx,
    infer TOutput
  >
    ? Awaited<TOutput>
    : never;
