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
 * Base error for failures talking to the Commerce App Management Service.
 * Catch this to handle all such failures in a single clause.
 *
 * The `retryable` flag tells the caller whether the failure is worth retrying
 * (a transient condition) or terminal.
 */
export class CamsError extends CommerceSdkErrorBase {
  /** Whether the failure is transient and worth retrying. */
  public readonly retryable: boolean = false;
}

/**
 * Thrown when the Commerce App Management Service record is owned by a different
 * client, or the adopting app's `extId` does not match the stored record
 * (HTTP 409 `owner-conflict` / `ext-mismatch`).
 *
 * This is terminal — the app cannot claim ownership — so callers should surface
 * it rather than retry.
 */
export class CamsAdoptConflictError extends CamsError {
  public override readonly retryable = false;

  public constructor(
    message = "The Commerce App Management Service record is owned by a different client or does not match this app.",
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(message, options);
  }
}

/**
 * Thrown when no Commerce App Management Service record exists for the app's
 * workspace (HTTP 404), even after retries. This happens when the record has
 * not been created yet, or its migration from Extension Manager has not landed.
 *
 * Retryable: the record may appear shortly (e.g. during inline migration).
 */
export class CamsRecordNotFoundError extends CamsError {
  public override readonly retryable = true;

  public constructor(
    message = "No Commerce App Management Service record was found for this app's workspace.",
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(message, options);
  }
}

/**
 * Thrown when the Commerce App Management Service is unreachable or responded
 * with an unexpected status (network failure, 5xx, or an unhandled 4xx).
 *
 * `retryable` reflects whether the underlying condition was transient (network
 * or 5xx) — defaults to `true`.
 */
export class CamsUnavailableError extends CamsError {
  public override readonly retryable: boolean;

  public constructor(
    message = "The Commerce App Management Service is unavailable.",
    options?: CommerceSdkErrorBaseOptions & { retryable?: boolean },
  ) {
    super(message, options);
    this.retryable = options?.retryable ?? true;
  }
}
