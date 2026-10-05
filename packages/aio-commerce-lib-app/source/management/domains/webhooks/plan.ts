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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { getInstallCommerceEnv } from "#config/lib/environment";

import { planAdditions, planRemovals, planUpdates } from "./diff";
import {
  collectConfiguredValues,
  resolveDesiredWebhooks,
  toResolvedWebhookPayload,
} from "./utils";

import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  PlanningInput,
  PlanningResult,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { WebhooksStepContext } from "./context";
import type {
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookSnapshotData,
} from "./types";

/**
 * Diffs the live webhooks against the target config into add, update, and remove
 * operations. Removes cover live webhooks the app owns that the target does not
 * declare. Blocks with `WEBHOOK_LIVE_READ_FAILED` if the live webhooks cannot be listed.
 */
export async function planWebhookSubscriptions(
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<PlanningResult<WebhookDomainPlan>> {
  const { path, baseline, targetConfig, failedAttempt } = input;
  const env = getInstallCommerceEnv(context.params);

  let live: ResolvedWebhookPayload[];
  try {
    const webhooks = await context.commerceWebhooksClient.getWebhookList();
    live = webhooks.map(toResolvedWebhookPayload);
  } catch (error) {
    return {
      issues: [
        {
          code: "WEBHOOK_LIVE_READ_FAILED",
          domain: "webhooks",
          message: `Could not list the live webhooks to plan against: ${await unwrapHttpError(error)}`,
        },
      ],
      kind: "blocked",
    };
  }

  const desired = targetConfig ? resolveDesiredWebhooks(targetConfig, env) : [];
  const declaredInBaseline = baseline
    ? resolveDesiredWebhooks(baseline.config, env)
    : [];

  const failedPlan = failedAttempt?.plan as WebhookDomainPlan | null;
  const declaredInFailedAttempt = failedAttempt?.targetConfig
    ? resolveDesiredWebhooks(failedAttempt.targetConfig, env)
    : [];

  const configuredValues = collectConfiguredValues(
    [...declaredInBaseline, ...declaredInFailedAttempt],
    { ...failedPlan?.configuredValues },
  );

  return {
    kind: "planned",
    plan: {
      configuredValues,
      operations: [
        // Removes precede adds so a rename never briefly double-registers a hook point.
        ...planRemovals(live, desired, declaredInBaseline, context.appId),
        ...planUpdates(live, desired, declaredInBaseline, configuredValues),
        ...planAdditions(live, desired, declaredInBaseline),
      ],
      path,
    },
  };
}
