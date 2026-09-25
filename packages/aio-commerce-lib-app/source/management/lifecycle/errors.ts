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

import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

import type { CommerceSdkErrorBaseOptions } from "@adobe/aio-commerce-lib-core/error";

/**
 * Base error for lifecycle orchestration failures. Catch this to handle every
 * planning, start and execution failure in a single clause.
 */
export class LifecycleOrchestrationError extends CommerceSdkErrorBase {}

/**
 * Thrown when the snapshot referenced as the lifecycle baseline can no longer
 * be read from storage, so there is nothing to plan or execute against.
 *
 * Restoring the snapshot, or re-running the installation to rebuild the
 * baseline, resolves the error.
 */
export class LifecycleBaselineNotFoundError extends LifecycleOrchestrationError {
  public constructor(options?: CommerceSdkErrorBaseOptions) {
    super("The lifecycle baseline snapshot is missing", options);
  }
}

/**
 * Thrown when an operation requires orchestration state that was never written,
 * which means no lifecycle operation has ever run for this app.
 *
 * Running a planning pass first resolves the error.
 */
export class LifecycleStateNotInitializedError extends LifecycleOrchestrationError {
  public constructor(options?: CommerceSdkErrorBaseOptions) {
    super("Lifecycle orchestration state has not been initialized", options);
  }
}

/**
 * Thrown when a lifecycle attempt is already pending or in progress, so a new
 * plan or attempt cannot be created.
 *
 * Waiting for the active attempt to finish, or for it to exceed its execution
 * deadline, resolves the error.
 */
export class LifecycleAttemptInProgressError extends LifecycleOrchestrationError {
  public constructor(options?: CommerceSdkErrorBaseOptions) {
    super("A lifecycle attempt is already in progress", options);
  }
}

/**
 * Thrown when the requested plan is no longer the pending one, because it was
 * replaced by a newer plan or already consumed by an attempt.
 *
 * Replanning and starting the returned plan resolves the error.
 */
export class PendingLifecyclePlanNotFoundError extends LifecycleOrchestrationError {
  public readonly planId: string;

  public constructor(planId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The pending lifecycle plan is missing or stale", options);
    this.planId = planId;
  }
}

/**
 * Thrown when the pending plan was produced by a different version of the
 * lifecycle action than the one trying to start it.
 *
 * Replanning with the current action version resolves the error.
 */
export class LifecyclePlanActionVersionMismatchError extends LifecycleOrchestrationError {
  public readonly actionVersion: string;

  public constructor(
    actionVersion: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(
      "The pending lifecycle plan was created by another action version",
      options,
    );
    this.actionVersion = actionVersion;
  }
}

/**
 * Thrown when starting an attempt for a plan that reported planning issues.
 *
 * Fixing the reported issues and replanning resolves the error.
 */
export class BlockedLifecyclePlanError extends LifecycleOrchestrationError {
  public readonly planId: string;

  public constructor(planId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The lifecycle plan is blocked by planning issues", options);
    this.planId = planId;
  }
}

/**
 * Thrown when the deadline given to start an attempt is not a valid timestamp
 * or is already in the past.
 *
 * Starting the attempt with a future deadline resolves the error.
 */
export class InvalidStartDeadlineError extends LifecycleOrchestrationError {
  public readonly executionDeadline: string;

  public constructor(
    executionDeadline: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super("Execution deadline is invalid or has already elapsed", options);
    this.executionDeadline = executionDeadline;
  }
}

/**
 * Thrown when the attempt to execute is not the latest recorded one, because it
 * was superseded or never persisted.
 *
 * Replanning and starting a new attempt resolves the error.
 */
export class LifecycleAttemptNotFoundError extends LifecycleOrchestrationError {
  public readonly attemptId: string;

  public constructor(attemptId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The lifecycle attempt is missing or stale", options);
    this.attemptId = attemptId;
  }
}

/**
 * Thrown when the attempt is no longer the current one, or is terminal or
 * expired, while its state is being read back during execution.
 *
 * Replanning and starting a new attempt resolves the error.
 */
export class StaleLifecycleAttemptError extends LifecycleOrchestrationError {
  public readonly attemptId: string;

  public constructor(attemptId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The lifecycle attempt is stale", options);
    this.attemptId = attemptId;
  }
}

/**
 * Thrown when the attempt being executed was created by a different version of
 * the lifecycle action than the one executing it.
 *
 * Replanning and starting a new attempt with the current action version
 * resolves the error.
 */
export class LifecycleAttemptActionVersionMismatchError extends LifecycleOrchestrationError {
  public readonly actionVersion: string;

  public constructor(
    actionVersion: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(
      "The lifecycle attempt was created by another action version",
      options,
    );
    this.actionVersion = actionVersion;
  }
}

/**
 * Thrown when the attempt is already being executed by another invocation, so
 * it must not be entered a second time.
 *
 * Waiting for the running execution to finish, or for the attempt to exceed its
 * execution deadline, resolves the error.
 */
export class LifecycleAttemptAlreadyExecutingError extends LifecycleOrchestrationError {
  public readonly attemptId: string;

  public constructor(attemptId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The lifecycle attempt is already in progress", options);
    this.attemptId = attemptId;
  }
}

/**
 * Thrown when the deadline given to execute an attempt is not a valid timestamp
 * or is already in the past.
 *
 * Re-invoking the execution with a future deadline resolves the error.
 */
export class InvalidExecutionDeadlineError extends LifecycleOrchestrationError {
  public readonly executionDeadline: string;

  public constructor(
    executionDeadline: string,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super("The lifecycle execution deadline is invalid or elapsed", options);
    this.executionDeadline = executionDeadline;
  }
}

/**
 * Thrown when a failed background dispatch cannot be recorded because the
 * attempt it belongs to is no longer the current pending one.
 *
 * Replanning and starting a new attempt resolves the error.
 */
export class DispatchedLifecycleAttemptNotFoundError extends LifecycleOrchestrationError {
  public readonly attemptId: string;

  public constructor(attemptId: string, options?: CommerceSdkErrorBaseOptions) {
    super("The dispatched lifecycle attempt is missing or stale", options);
    this.attemptId = attemptId;
  }
}
