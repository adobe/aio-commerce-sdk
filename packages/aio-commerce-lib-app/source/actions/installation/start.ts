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
import { getPlanInputs, prepareRequest, resolveOperation } from "./plan";

import type { RequestHandlerArgs } from "./common";

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
  if (prepared.kind === "rejected") {
    return prepared.response;
  }

  const { request } = prepared;
  const { stateStore } = request.runtime;
  const storedState = await stateStore.get(CURRENT_STATE_KEY);
  const state =
    storedState && (await normalizeExpiredAttempt(stateStore, storedState));

  const attempt = state?.latestAttempt;
  if (attempt?.status === "pending" || attempt?.status === "in-progress") {
    return attemptInProgressConflict(attempt);
  }

  const pendingPlan = state?.pendingPlan;
  if (pendingPlan?.id !== planId) {
    return stalePlanConflict(
      "The plan is no longer the pending plan. Call POST /plan again and review the new plan.",
    );
  }

  const resolved = await resolveOperation(
    request,
    pendingPlan.operation === "uninstall" ? "uninstall" : undefined,
  );

  if (resolved.kind === "rejected") {
    return resolved.response;
  }

  const { operation } = resolved;

  // The installed state changed since planning, so the reviewed plan no longer applies.
  if (operation !== pendingPlan.operation) {
    return stalePlanConflict(
      `The plan is for an ${pendingPlan.operation}, but the app now needs an ${operation}. Call POST /plan again.`,
    );
  }

  const planned = await planOperation({
    ...getPlanInputs(operation, request.appConfig),
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
    logger: args.logger,
    params: request.params,
    planning: planned.planning,
    runtime: request.runtime,
  });
}
