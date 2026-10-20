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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

/** The statuses a lifecycle attempt can have. */
export const ATTEMPT_STATUSES = [
  "pending",
  "in-progress",
  "succeeded",
  "failed",
] as const;

/** An extension of the service, as listed for a workspace. */
export const ExtensionSchema = v.object({
  id: v.string(),
  scope: v.optional(
    v.object({
      commerceBaseUrl: v.optional(v.nullable(v.string())),
      commerceEnv: v.optional(v.nullable(v.picklist(["paas", "saas"]))),
      commerceId: v.optional(v.string()),
      workspaceId: v.optional(v.string()),
      workspaceName: v.optional(v.string()),
    }),
  ),
});

/** The answer of the service to a lookup by workspace. */
export const ExtensionListSchema = v.array(ExtensionSchema);

export type Extension = v.InferOutput<typeof ExtensionSchema>;

/** The plan the service returns for review. */
export const UpgradePlanAnswerSchema = v.object({
  plan: v.looseObject({
    id: v.string(),
    operation: v.string(),
    sourceVersion: v.optional(v.nullable(v.string())),
    targetVersion: v.optional(v.nullable(v.string())),
  }),
});

export type UpgradePlan = v.InferOutput<typeof UpgradePlanAnswerSchema>["plan"];

/** The status of a lifecycle attempt, as the app reports it through the service. */
export const AttemptStatusSchema = v.object({
  activations: v.optional(
    v.object({
      execution: v.optional(v.string()),
      start: v.optional(v.string()),
    }),
  ),
  error: v.optional(
    v.object({
      key: v.string(),
      message: v.optional(v.string()),
    }),
  ),
  id: v.string(),
  result: v.optional(
    v.nullable(v.object({ appVersion: v.string(), snapshotId: v.string() })),
  ),
  status: v.picklist(ATTEMPT_STATUSES),
});

export type AttemptStatus = v.InferOutput<typeof AttemptStatusSchema>;

/** The answer of the service to a read of the latest attempts. */
export const LatestAttemptSchema = v.union([
  AttemptStatusSchema,
  v.pipe(
    v.array(AttemptStatusSchema),
    v.transform((attempts) => attempts.at(0)),
  ),
]);

/** The parameters to find the extension associated with a workspace. */
export const FindExtensionParamsSchema = v.object({
  workspaceId: nonEmptyStringValueSchema("workspaceId"),
});

export type FindExtensionParams = v.InferInput<
  typeof FindExtensionParamsSchema
>;

/** The parameters of the calls that act on the upgrades of an extension. */
export const ExtensionParamsSchema = v.object({
  extensionId: nonEmptyStringValueSchema("extensionId"),
});

export type ExtensionParams = v.InferInput<typeof ExtensionParamsSchema>;

/** The parameters to start a planned upgrade. */
export const StartUpgradeParamsSchema = v.object({
  ...ExtensionParamsSchema.entries,
  planId: nonEmptyStringValueSchema("planId"),
});

export type StartUpgradeParams = v.InferInput<typeof StartUpgradeParamsSchema>;

/** The parameters to read the status of one upgrade attempt. */
export const PollUpgradeParamsSchema = v.object({
  ...ExtensionParamsSchema.entries,
  runId: nonEmptyStringValueSchema("runId"),
});

export type PollUpgradeParams = v.InferInput<typeof PollUpgradeParamsSchema>;
