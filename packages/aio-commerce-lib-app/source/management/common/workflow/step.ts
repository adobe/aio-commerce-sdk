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
import type { AppData } from "../schema";
import type { DomainPlan, ResourceCapability } from "./resource";
import type { WorkflowData } from "./types";

// Defined here (not in validation.ts) to avoid circular imports, since step
// validate handlers need this type and validation.ts imports from step.ts.

/** Severity level of a validation issue. */
export type ValidationIssueSeverity = "error" | "warning" | "info";

/** A single validation issue reported by a step's validate handler. */
export type ValidationIssue = {
  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;

  /** Severity of the issue. Only "error" severity blocks the workflow. */
  severity: ValidationIssueSeverity;

  /** Optional additional context about the issue. */
  details?: Record<string, unknown>;
};

/** Shared context available to all steps during a lifecycle workflow. */
export type LifecycleContext = {
  /** The credentials of the app being managed. */
  appData: AppData;

  /** The raw action parameters from the App Builder runtime action. */
  params: RuntimeActionParams & {
    AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
    AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: string | string[];
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: string;
    AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: string;
    AIO_COMMERCE_AUTH_IMS_ORG_ID: string;
    AIO_COMMERCE_AUTH_IMS_SCOPES: string | string[];
  };

  /** Logger instance for workflow logging. */
  logger: ReturnType<typeof AioLogger>;

  /** Custom scripts defined in the configuration (if any). */
  customScripts?: Record<string, unknown>;
};

/** Factory function type for creating step-specific context. */
export type StepContextFactory<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = (context: LifecycleContext) => TStepCtx | Promise<TStepCtx>;

/** The execution context passed to leaf step run handlers. */
export type ExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = LifecycleContext & TStepCtx;

/**
 * A narrowed context available to step `validate` handlers.
 * Excludes `customScripts` — those only apply during execution, not pre-flight validation.
 */
export type ValidationContext = Omit<LifecycleContext, "customScripts">;

/** The context passed to step `validate` handlers (base validation context merged with step-level context). */
export type ValidationExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ValidationContext & TStepCtx;

/** Metadata info for a step (used for UI display). */
export type StepMetaInfo = {
  label: string;
  description?: string;
};

/** Step metadata keyed by lifecycle mode. */
export type StepMeta = {
  install: StepMetaInfo;
  uninstall?: StepMetaInfo;
  upgrade?: StepMetaInfo;
};

/** Defines the base properties of a step. */
export type StepBase<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
> = {
  /** The name of this step. */
  name: TName;

  /** Metadata associated with the step, keyed by lifecycle mode. */
  meta: StepMeta;

  /** Whether the step should be taken into consideration. */
  when?: (config: CommerceAppConfigOutputModel) => config is TConfig;
};

/**
 * A leaf step that executes work (no children).
 *
 * May optionally contribute the resource-reconciliation capability; `plan` and
 * `apply` are meant to be provided together (plan the changes, then apply them).
 */
export type LeafStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
  TPlan extends DomainPlan = DomainPlan,
  TSnapshotData extends WorkflowData = WorkflowData,
> = StepBase<TName, TConfig> & {
  type: "leaf";

  /** The execution handler for the step. */
  install: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => TOutput | Promise<TOutput>;

  /**
   * Optional pre-execution validation handler.
   * Called before the workflow begins to surface issues (errors or warnings).
   * Returning an empty array means the step has no issues.
   */
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;

  /**
   * Optional uninstall handler for the step.
   * Called during uninstallation to reverse the work done by `install`.
   * If absent, the step is silently skipped during uninstallation.
   */
  uninstall?: (
    config: TConfig,
    context: ExecutionContext<TStepCtx>,
  ) => void | Promise<void>;
} & Partial<ResourceCapability<TConfig, TStepCtx, TPlan, TSnapshotData>>;

/** A branch step that contains children (no execution). */
export type BranchStep<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TChildren extends AnyStep[] = AnyStep[],
> = StepBase<TName, TConfig> & {
  type: "branch";

  /** An optional factory function to setup shared context for the children steps. */
  context?: StepContextFactory<TStepCtx>;

  /** The children steps of this branch. */
  children: TChildren;

  /**
   * Optional pre-execution validation handler for the branch itself.
   * Called before children are validated. Returning an empty array means
   * the branch has no issues at this level.
   */
  validate?: (
    config: TConfig,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
};

/** A step in the workflow tree (discriminated union by `type`). */
export type Step<
  TName extends string = string,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> =
  | LeafStep<TName, TConfig, TStepCtx, TOutput>
  | BranchStep<TName, TConfig, TStepCtx>;

/** Loosely-typed step for use in non type-safe contexts. */
export type AnyStep = {
  children?: AnyStep[];

  // biome-ignore-start lint/suspicious/noExplicitAny: We need the flexibility here
  apply?: (plan: any, context: any) => unknown | Promise<unknown>;
  context?: (context: LifecycleContext) => any;
  install?: (config: any, context: any) => unknown | Promise<unknown>;
  meta: StepMeta;
  name: string;
  plan?: (input: any, context: any) => unknown | Promise<unknown>;
  type: "leaf" | "branch";

  uninstall?: (config: any, context: any) => void | Promise<void>;

  validate?: (
    config: any,
    context: any,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;

  when?: (config: CommerceAppConfigOutputModel) => boolean;
  // biome-ignore-end lint/suspicious/noExplicitAny: We no longer need the flexibility
};

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
  TPlan extends DomainPlan = DomainPlan,
  TSnapshotData extends WorkflowData = WorkflowData,
> = Omit<
  LeafStep<TName, TConfig, TStepCtx, TOutput, TPlan, TSnapshotData>,
  "type"
>;

/** Options for defining a branch step. */
export type BranchStepOptions<
  TName extends string,
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TChildren extends AnyStep[] = AnyStep[],
> = Omit<BranchStep<TName, TConfig, TStepCtx, TChildren>, "type">;

/**
 * Define a leaf step (executable, no children).
 *
 * @example
 * ```typescript
 * const createProviders = defineLeafStep({
 *   name: "providers",
 *   meta: { install: { label: "Create Providers", description: "Creates I/O Events providers" } },
 *   install: async ({ config, stepContext }) => {
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
  TPlan extends DomainPlan = DomainPlan,
  TSnapshotData extends WorkflowData = WorkflowData,
>(
  options: LeafStepOptions<
    TName,
    TConfig,
    TStepCtx,
    TOutput,
    TPlan,
    TSnapshotData
  >,
) {
  return {
    apply: options.apply,
    install: options.install,
    meta: options.meta,
    name: options.name,
    plan: options.plan,
    type: "leaf",
    uninstall: options.uninstall,
    validate: options.validate,
    when: options.when,
  } satisfies LeafStep<TName, TConfig, TStepCtx, TOutput, TPlan, TSnapshotData>;
}

/**
 * Define a branch step (container with children, no runner).
 *
 * @example
 * ```typescript
 * const eventing = defineBranchStep({
 *   name: "eventing",
 *   meta: { install: { label: "Eventing", description: "Sets up I/O Events" } },
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
  const TChildren extends AnyStep[] = AnyStep[],
>(options: BranchStepOptions<TName, TConfig, TStepCtx, TChildren>) {
  return {
    children: options.children,
    context: options.context,
    meta: options.meta,
    name: options.name,
    type: "branch",
    validate: options.validate,
    when: options.when,
  } satisfies BranchStep<TName, TConfig, TStepCtx, TChildren>;
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
