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

import type { CommerceSdkErrorOptions } from "@adobe/aio-commerce-lib-core/error";
import type { ResourceDomain } from "./types";

/** Options for {@link UnsupportedReconcileChangeError}. */
export type UnsupportedReconcileChangeErrorOptions = CommerceSdkErrorOptions<{
  /** The resource domain the unsupported change belongs to. */
  domain: ResourceDomain;

  /** The version-stable identity of the resource that changed. */
  identity: string;
}>;

/**
 * Thrown by a leaf step's `reconcile` handler when a resource's `changed` diff kind has
 * no in-place update path yet (e.g. no PUT endpoint exists to apply the change).
 *
 * Reconcile handlers throw this instead of silently skipping the change or falling back
 * to a destructive delete+recreate, so the update workflow surfaces the gap as a failed
 * step rather than an unnoticed no-op.
 */
export class UnsupportedReconcileChangeError extends CommerceSdkErrorBase {
  /** The resource domain the unsupported change belongs to. */
  public readonly domain: ResourceDomain;

  /** The version-stable identity of the resource that changed. */
  public readonly identity: string;

  /**
   * Constructs a new {@link UnsupportedReconcileChangeError} instance.
   *
   * @param options - The domain and identity of the unsupported change, plus base error options.
   */
  public constructor({
    domain,
    identity,
    ...options
  }: UnsupportedReconcileChangeErrorOptions) {
    super(
      `Cannot reconcile a "changed" ${domain} resource ("${identity}"): no in-place update path exists yet.`,
      options,
    );

    this.domain = domain;
    this.identity = identity;
  }
}
