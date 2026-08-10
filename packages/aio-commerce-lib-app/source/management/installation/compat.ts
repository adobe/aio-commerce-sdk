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

/**
 * Back-compat aliases for the workflow engine types that were renamed when the
 * engine was generalized to lifecycle-neutral names and moved to
 * `#management/common/workflow`. These preserve the previously-public installation
 * names so existing consumers keep compiling.
 */

import type {
  ExecutionStatus,
  FailedWorkflowState,
  InProgressWorkflowState,
  LifecycleContext,
  SucceededWorkflowState,
  WorkflowData,
  WorkflowError,
  WorkflowRunState,
  WorkflowStateMetadata,
} from "#management/common/workflow/index";

/** @deprecated Use `LifecycleContext` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationContext = LifecycleContext;

/** @deprecated Use `WorkflowData` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationData = WorkflowData;

/** @deprecated Use `WorkflowError` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationError<TPayload = unknown> = WorkflowError<TPayload>;

/** @deprecated Use `ExecutionStatus` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationStatus = ExecutionStatus;

/** @deprecated Use `WorkflowRunState` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationState = WorkflowRunState;

/** @deprecated Use `InProgressWorkflowState` from `@adobe/aio-commerce-lib-app/management`. */
export type InProgressInstallationState = InProgressWorkflowState;

/** @deprecated Use `SucceededWorkflowState` from `@adobe/aio-commerce-lib-app/management`. */
export type SucceededInstallationState = SucceededWorkflowState;

/** @deprecated Use `FailedWorkflowState` from `@adobe/aio-commerce-lib-app/management`. */
export type FailedInstallationState = FailedWorkflowState;

/** @deprecated Use `WorkflowStateMetadata` from `@adobe/aio-commerce-lib-app/management`. */
export type InstallationRetryMetadata = WorkflowStateMetadata;
