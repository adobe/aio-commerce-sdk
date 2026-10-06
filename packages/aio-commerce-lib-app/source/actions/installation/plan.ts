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

import {
  conflict,
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { isBranchStep } from "#management/common/workflow/step";
import { isStepConfigured } from "#management/common/workflow/utils";
import { toValidationResult } from "#management/common/workflow/validation";
import {
  createInstallationStore,
  createUninstallationStore,
  getStorageKey,
} from "#management/deprecated/stores";
import { isInProgressState, isSucceededState } from "#management/index";
import {
  CURRENT_STATE_KEY,
  isOrchestrationStateUnreadable,
} from "#management/lifecycle/state";

import {
  createLifecycleRuntime,
  notAssociatedConflict,
  resolveWorkflowParams,
} from "./common";
import { attemptInProgressConflict, planOperation } from "./lifecycle";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecycleOperation,
  LifecyclePlan,
} from "#management/common/orchestration";
import type {
  PlanningIssue,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { AnyStep } from "#management/common/workflow/step";
import type {
  StepValidationResult,
  ValidationIssue,
  ValidationIssueSeverity,
} from "#management/common/workflow/validation";
import type { RequestHandlerArgs, WorkflowRouteParams } from "./common";
import type { LifecycleRuntime } from "./lifecycle";

/** An operation listed in a plan preview. */
type PlanPreviewOperation = {
  id: string;
  kind: ResourceOperation<unknown>["kind"];
  label: string;
  reason: ResourceOperation<unknown>["reason"];
};

/** The operations a plan preview lists for one domain. */
type PlanPreviewDomain = {
  path: string[];
  operations: PlanPreviewOperation[];
};

/** An issue listed in a plan preview. */
type PlanPreviewIssue = {
  domain: string;
  code: string;
  message: string;
  path?: string[];
  severity: ValidationIssueSeverity;
  blocking: boolean;
};

/** The plan `POST /plan` returns for review, without internal or sensitive values. */
export type PlanPreview = {
  /** The `planId` to start the plan with. */
  id: string;
  operation: LifecycleOperation;
  domains: PlanPreviewDomain[];
  issues: PlanPreviewIssue[];
};

/** A request that can plan, with everything it plans with. */
export type PreparedRequest = {
  actionVersion: string;
  appConfig: CommerceAppConfigOutputModel;
  baseline: AppStateSnapshot | null;

  /** Whether the state names a baseline snapshot that is no longer stored. */
  isBaselineMissing: boolean;
  params: WorkflowRouteParams;
  runtime: LifecycleRuntime;
};

/** The response that ends a request before it plans. */
type RejectedRequest = { kind: "rejected"; response: ActionResponse };

/** The prepared request, or the response that ends it. */
type PrepareRequestResult =
  | { kind: "prepared"; request: PreparedRequest }
  | RejectedRequest;

/** The operation to plan, or the response that refuses it. */
type ResolveOperationResult =
  | { kind: "resolved"; operation: LifecycleOperation }
  | RejectedRequest;

/**
 * Checks what every planning request needs (the action version, the app config and an
 * association) and creates the lifecycle runtime.
 */
export async function prepareRequest({
  body,
  logger,
  rawParams,
}: RequestHandlerArgs): Promise<PrepareRequestResult> {
  const actionVersion = process.env.__OW_ACTION_VERSION;
  if (!actionVersion) {
    return rejected(
      internalServerError(
        "The OpenWhisk action version is required to plan a lifecycle operation",
      ),
    );
  }

  const rawAppConfig = rawParams.appConfig;
  if (!rawAppConfig) {
    return rejected(
      internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      ),
    );
  }

  const params = await resolveWorkflowParams(body, rawParams);
  if (!params) {
    return rejected(notAssociatedConflict());
  }

  logger.debug(
    `Lifecycle request for app "${body.appData.projectName}" (workspace: "${body.appData.workspaceName}", commerce: "${params.AIO_COMMERCE_API_BASE_URL}")`,
  );

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const runtime = await createLifecycleRuntime(params, appConfig, logger);
  const state = await runtime.stateStore.get(CURRENT_STATE_KEY);
  const baselineSnapshotId = state?.baselineSnapshotId ?? null;
  const baseline = await runtime.baselineProvider.get(baselineSnapshotId);
  const isBaselineMissing = baselineSnapshotId !== null && !baseline;

  return {
    kind: "prepared",
    request: {
      actionVersion,
      appConfig,
      baseline,
      isBaselineMissing,
      params,
      runtime,
    },
  };
}

/**
 * Plans the operation a request asks for, validates the plan's operations and stores it as the
 * pending plan. The response carries the validation result and the plan, whose `id` starts it.
 */
export async function planRequestedOperation(args: RequestHandlerArgs) {
  const prepared = await prepareRequest(args);
  if (prepared.kind === "rejected") {
    return prepared.response;
  }

  const { request } = prepared;
  const resolved = await resolveOperation(request, args.body.operation);
  if (resolved.kind === "rejected") {
    return resolved.response;
  }

  const { operation } = resolved;
  args.logger.debug(`Planning and validating the ${operation}...`);
  const planned = await planOperation({
    ...getPlanInputs(operation, request.appConfig),
    actionVersion: request.actionVersion,
    operation,
    runtime: request.runtime,
    validate: true,
  });

  if (planned.kind === "rejected") {
    return planned.response;
  }

  return ok({
    body: toPlanResponse(planned.planning.plan, request.runtime.rootStep),
  });
}

/**
 * Resolves the operation to plan: `uninstall` when asked for, otherwise `upgrade` when a baseline
 * exists and `install` when not. Returns the response that refuses it when it cannot be planned.
 */
export async function resolveOperation(
  { appConfig, baseline, isBaselineMissing, runtime }: PreparedRequest,
  requested?: "uninstall",
): Promise<ResolveOperationResult> {
  // An unreadable state reads as missing, which would plan an install over the installed app.
  if (!baseline && (await isOrchestrationStateUnreadable(runtime.stateStore))) {
    return rejected(
      conflict({
        body: {
          message:
            "The stored lifecycle state cannot be read and there is no installation record to rebuild it from. Nothing was planned.",
          reason: "unreadable-state",
        },
      }),
    );
  }

  // The state names a baseline that is gone, so neither what is installed nor what to do is known.
  if (isBaselineMissing) {
    return rejected(
      conflict({
        body: {
          message:
            "The lifecycle state names a baseline snapshot that no longer exists. Nothing was planned.",
          reason: "baseline-missing",
        },
      }),
    );
  }

  if (requested === "uninstall") {
    return resolvedUnlessRefused("uninstall", await refuseLegacyUninstall());
  }

  if (!baseline) {
    return resolvedUnlessRefused("install", await refuseLegacyInstall());
  }

  return resolvedUnlessRefused("upgrade", refuseUpgrade(baseline, appConfig));
}

/** The operation as resolved, or the refusal when there is one. */
function resolvedUnlessRefused(
  operation: LifecycleOperation,
  refusal: ActionResponse | null,
): ResolveOperationResult {
  return refusal ? rejected(refusal) : { kind: "resolved", operation };
}

/** The target and fallback baseline an operation plans with. */
export function getPlanInputs(
  operation: LifecycleOperation,
  appConfig: CommerceAppConfigOutputModel,
) {
  return operation === "uninstall"
    ? { fallbackBaselineConfig: appConfig, targetConfig: null }
    : { targetConfig: appConfig };
}

/** Refuses an uninstall while an older library version is uninstalling the app. */
async function refuseLegacyUninstall() {
  const record = await (await createUninstallationStore()).get(getStorageKey());

  return record && isInProgressState(record)
    ? attemptInProgressConflict()
    : null;
}

/** Refuses an install over an app that an older library version installed or is installing. */
async function refuseLegacyInstall() {
  const record = await (await createInstallationStore()).get(getStorageKey());
  if (record && isInProgressState(record)) {
    return attemptInProgressConflict();
  }

  // A succeeded record with a config becomes the lifecycle baseline, so only one without it gets here.
  if (record && isSucceededState(record)) {
    return conflict({
      body: {
        message:
          "The existing installation does not include its original config and cannot be upgraded safely. Uninstall and reinstall the app.",
        reason: "installed-without-config",
      },
    });
  }

  return null;
}

/** Refuses an upgrade that changes the app id or keeps the installed version. */
function refuseUpgrade(
  baseline: AppStateSnapshot,
  appConfig: CommerceAppConfigOutputModel,
) {
  if (baseline.config.metadata.id !== appConfig.metadata.id) {
    return conflict({
      body: {
        message: `The application ID (metadata.id) cannot be changed during an upgrade. Expected "${baseline.config.metadata.id}", received "${appConfig.metadata.id}".`,
      },
    });
  }

  if (baseline.config.metadata.version === appConfig.metadata.version) {
    return conflict({
      body: {
        message: "The app is already on the target version.",
        reason: "already-current",
      },
    });
  }

  return null;
}

/** Wraps the response that ends a request. */
function rejected(response: ActionResponse): RejectedRequest {
  return { kind: "rejected", response };
}

/** The validation result of a plan's issues, plus the plan preview. */
function toPlanResponse(plan: LifecyclePlan, rootStep: AnyStep) {
  const result = toStepValidationResult(
    rootStep,
    plan.target?.config,
    plan.operation,
    plan.issues,
    [],
  );

  return { ...toValidationResult(result), plan: toPlanPreview(plan) };
}

/** Builds the validation tree of the steps configured in the plan's target, or of every step without one, with each issue under the step that raised it. */
function toStepValidationResult(
  step: AnyStep,
  config: CommerceAppConfigOutputModel | undefined,
  operation: LifecycleOperation,
  issues: PlanningIssue[],
  parentPath: string[],
): StepValidationResult {
  const path = [...parentPath, step.name];
  const isRoot = parentPath.length === 0;
  const ownIssues = issues.filter((issue) =>
    issue.path ? issue.path.join("/") === path.join("/") : isRoot,
  );

  const children = isBranchStep(step)
    ? step.children
        .filter((child) => !config || isStepConfigured(child, config))
        .map((child) =>
          toStepValidationResult(child, config, operation, issues, path),
        )
    : [];

  return {
    children,
    issues: ownIssues.map(toValidationIssue),
    meta: step.meta[operation] ?? step.meta.install,
    name: step.name,
    path,
  };
}

/** A planning issue as a validation issue. */
function toValidationIssue(issue: PlanningIssue): ValidationIssue {
  return {
    code: issue.code,
    details: issue.details,
    message: issue.message,
    severity: issue.severity ?? "error",
  };
}

/** The preview of a plan returned for review. */
function toPlanPreview(plan: LifecyclePlan): PlanPreview {
  return {
    domains: plan.domains.map((domain) => ({
      operations: domain.operations.map(({ id, kind, label, reason }) => ({
        id,
        kind,
        label,
        reason,
      })),
      path: domain.path,
    })),
    id: plan.id,
    issues: plan.issues.map((issue) => ({
      blocking: issue.blocking !== false,
      code: issue.code,
      domain: issue.domain,
      message: issue.message,
      path: issue.path,
      severity: issue.severity ?? "error",
    })),
    operation: plan.operation,
  };
}
