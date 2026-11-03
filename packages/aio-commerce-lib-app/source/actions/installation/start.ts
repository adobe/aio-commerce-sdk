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

import { badRequest } from "@adobe/aio-commerce-lib-core/responses";

import { nowIsoString } from "#management/common/workflow/utils";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
} from "#management/lifecycle/state";

import {
  attemptInProgressConflict,
  planOperation,
  stalePlanConflict,
  startPlannedOperation,
} from "./lifecycle";
import { describeActiveAttempt } from "./logging";
import {
  getPlanInputs,
  prepareRequest,
  resolveOperation,
  toBusinessConfigOnlyConfig,
} from "./plan";

import type { OrchestrationState } from "#management/common/orchestration";
import type { RequestHandlerArgs } from "./common";
import type { PreparedRequest } from "./plan";

/**
 * Starts the pending plan named by `body.planId`, whatever its operation. Plans it again first,
 * and records how the new plan differs from the reviewed one on the attempt.
 */
export async function startPlannedRequest(args: RequestHandlerArgs) {
  const { planId } = args.body;
  if (!planId) {
    return badRequest(
      "A lifecycle operation starts from a plan. Call POST /plan and pass the planId it returns.",
    );
  }

  const prepared = await prepareRequest(args);
  const { logger } = args;

  if (prepared.kind === "rejected") {
    return prepared.response;
  }

  const { request } = prepared;
  const { stateStore } = request.runtime;
  const storedState = await stateStore.get(CURRENT_STATE_KEY);
  const state =
    storedState &&
    (await normalizeExpiredAttempt(stateStore, storedState, logger));

  const attempt = state?.latestAttempt;
  if (attempt?.status === "pending" || attempt?.status === "in-progress") {
    logger.warn(
      `Refused to start plan ${planId} because ${describeActiveAttempt(attempt)}.`,
    );

    return attemptInProgressConflict(attempt);
  }

  const pendingPlan = state?.pendingPlan;
  if (pendingPlan?.id !== planId) {
    logger.warn(
      `Refused to start plan ${planId} because it is not the pending plan (the pending plan is ${pendingPlan?.id ?? "none"}).`,
    );

    return stalePlanConflict(
      "The plan is no longer the pending plan. Call POST /plan again and review the new plan.",
    );
  }

  // Start derives everything from the pending plan, not from what the request says is installed.
  const businessConfigOnlyVersion =
    pendingPlan.operation === "upgrade" &&
    pendingPlan.source?.snapshotId === null
      ? pendingPlan.source.appVersion
      : null;

  const resolved = await resolveOperation(
    { ...request, businessConfigOnlyVersion },
    pendingPlan.operation === "uninstall" ? "uninstall" : undefined,
  );

  if (resolved.kind === "rejected") {
    return resolved.response;
  }

  const { operation } = resolved;

  // The installed state changed since planning, so the reviewed plan no longer applies.
  if (operation !== pendingPlan.operation) {
    logger.warn(
      `Refused to start plan ${planId} because it is for an ${pendingPlan.operation}, but the app now needs an ${operation}.`,
    );

    return stalePlanConflict(
      `The plan is for an ${pendingPlan.operation}, but the app now needs an ${operation}. Call POST /plan again.`,
    );
  }

  // Written before running, so the attempt is a normal upgrade and a failure retries from a real baseline.
  if (businessConfigOnlyVersion && !request.baseline && state) {
    await writeBusinessConfigOnlyBaseline(
      request,
      state,
      businessConfigOnlyVersion,
    );
  }

  const planned = await planOperation({
    ...getPlanInputs(operation, request.appConfig, businessConfigOnlyVersion),
    actionVersion: request.actionVersion,
    operation,
    reviewedPlanId: planId,
    runtime: request.runtime,
  });

  if (planned.kind === "rejected") {
    return planned.response;
  }

  return startPlannedOperation({
    actionVersion: request.actionVersion,
    logger,
    params: request.params,
    planning: planned.planning,
    runtime: request.runtime,
  });
}

/**
 * Stores the baseline of an app installed with only business configuration: the target config
 * without what needs installation, at the installed version, with no installed data.
 */
async function writeBusinessConfigOnlyBaseline(
  { appConfig, runtime }: PreparedRequest,
  state: OrchestrationState,
  installedVersion: string,
) {
  const snapshot = {
    attemptId: null,
    config: toBusinessConfigOnlyConfig(appConfig, installedVersion),
    createdAt: nowIsoString(),
    data: null,
    id: crypto.randomUUID(),
  };

  await runtime.snapshotStore.put(snapshot.id, snapshot);
  await runtime.stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    baselineSnapshotId: snapshot.id,
  });
}
