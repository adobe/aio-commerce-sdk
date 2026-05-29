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

import * as v from "valibot";

import { AppDataSchema } from "#management/installation/schema";

import type {
  ExecutionStatus,
  StepStatus,
  StepValidationResult,
  ValidationIssueSeverity,
} from "#management/index";

// ---------------------------------------------------------------------------
// Shared primitives — building blocks used across multiple endpoints
// ---------------------------------------------------------------------------

export const StepMetaInfoSchema = v.object({
  label: v.string(),
  description: v.optional(v.string()),
});

export const PendingStatusSchema = v.literal("pending");
export const InProgressStatusSchema = v.literal("in-progress");
export const SucceededStatusSchema = v.literal("succeeded");
export const FailedStatusSchema = v.literal("failed");

export const ExecutionStatusSchema: v.GenericSchema<ExecutionStatus> = v.union([
  PendingStatusSchema,
  InProgressStatusSchema,
  SucceededStatusSchema,
  FailedStatusSchema,
]);

export const ErrorSeveritySchema = v.literal("error");
export const WarningSeveritySchema = v.literal("warning");
export const InfoSeveritySchema = v.literal("info");

export const ValidationIssueSeveritySchema: v.GenericSchema<ValidationIssueSeverity> =
  v.union([ErrorSeveritySchema, WarningSeveritySchema, InfoSeveritySchema]);

export const StepStatusSchema: v.GenericSchema<StepStatus> = v.pipe(
  v.object({
    name: v.string(),
    id: v.string(),
    path: v.array(v.string()),
    meta: StepMetaInfoSchema,
    status: ExecutionStatusSchema,
    children: v.array(v.lazy(() => StepStatusSchema)),
  }),
  v.title("StepStatus"),
);

export const InstallationDataSchema = v.nullable(
  v.record(v.string(), v.unknown()),
);

export const InstallationErrorSchema = v.object({
  path: v.array(v.string()),
  key: v.string(),
  message: v.optional(v.string()),
  payload: v.optional(v.unknown()),
});

// ---------------------------------------------------------------------------
// Shared state schemas — used by GET /, GET /uninstallation, and execution endpoints
// ---------------------------------------------------------------------------

const InProgressInstallationStateSchema = v.object({
  id: v.string(),
  status: InProgressStatusSchema,
  startedAt: v.string(),
  step: StepStatusSchema,
  data: InstallationDataSchema,
});

const SucceededInstallationStateSchema = v.object({
  id: v.string(),
  status: SucceededStatusSchema,
  startedAt: v.string(),
  completedAt: v.string(),
  step: StepStatusSchema,
  data: InstallationDataSchema,
});

const FailedInstallationStateSchema = v.object({
  id: v.string(),
  status: FailedStatusSchema,
  startedAt: v.string(),
  completedAt: v.string(),
  step: StepStatusSchema,
  data: InstallationDataSchema,
  error: InstallationErrorSchema,
});

export const InstallationStateSchema = v.union([
  InProgressInstallationStateSchema,
  SucceededInstallationStateSchema,
  FailedInstallationStateSchema,
]);

// ---------------------------------------------------------------------------
// POST / — start installation
// ---------------------------------------------------------------------------

/** Request body for POST / and POST /validation (shared shape) */
export const InstallationRequestBodySchema = v.object({
  appData: AppDataSchema,
  commerceBaseUrl: v.string(),
  commerceEnv: v.string(),
  ioEventsUrl: v.string(),
  ioEventsEnv: v.string(),
});

/** 202 response for POST / */
export const AcceptedBodySchema = v.object({
  message: v.string(),
  activationId: v.optional(v.string()),
  id: v.string(),
  status: InProgressStatusSchema,
  startedAt: v.string(),
  step: StepStatusSchema,
  data: InstallationDataSchema,
});

/** 409 response for POST / */
export const ConflictBodySchema = v.object({
  message: v.string(),
});

// ---------------------------------------------------------------------------
// POST /execution — execute installation (internal, called async)
// ---------------------------------------------------------------------------

/** 500 response for POST /execution and POST /uninstallation/execution */
export const FailedExecutionBodySchema = v.object({
  message: v.string(),
  error: InstallationErrorSchema,
  state: FailedInstallationStateSchema,
});

// ---------------------------------------------------------------------------
// POST /validation — pre-installation validation
// ---------------------------------------------------------------------------

const ValidationIssueSchema = v.object({
  code: v.string(),
  message: v.string(),
  severity: ValidationIssueSeveritySchema,
  details: v.optional(v.record(v.string(), v.unknown())),
});

export const StepValidationResultSchema: v.GenericSchema<StepValidationResult> =
  v.pipe(
    v.object({
      name: v.string(),
      path: v.array(v.string()),
      meta: StepMetaInfoSchema,
      issues: v.array(ValidationIssueSchema),
      children: v.array(v.lazy(() => StepValidationResultSchema)),
    }),
    v.title("StepValidationResult"),
  );

/** 200 response for POST /validation */
export const ValidationResultSchema = v.object({
  valid: v.boolean(),
  summary: v.object({
    totalIssues: v.number(),
    errors: v.number(),
    warnings: v.number(),
  }),
  result: StepValidationResultSchema,
});
