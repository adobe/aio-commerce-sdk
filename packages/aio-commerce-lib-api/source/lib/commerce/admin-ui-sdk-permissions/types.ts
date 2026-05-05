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

import type { AdobeCommerceHttpClient } from "../http-client";

/** Options used to create an Admin UI SDK permission client. */
export interface AdminUiSdkPermissionClientOptions {
  /** Milliseconds to cache a permission result. Default: 300_000 (5 minutes). Set to 0 to disable caching. */
  cacheTtlMs?: number;
  /** Return false instead of throwing when a network or parse error occurs. Default: true. */
  denyOnError?: boolean;
  httpClient: AdobeCommerceHttpClient;
}

/** Client for checking the current user's Admin UI SDK resource permissions. */
export interface AdminUiSdkPermissionClient {
  /**
   * Returns `true` if the current user has the given resource granted, `false` if denied.
   * Returns `false` on network or parse errors when `denyOnError: true` (default).
   * Always throws `AdminUiSdkPermissionError` on 401, regardless of `denyOnError`.
   */
  check(resource: string): Promise<boolean>;
  /**
   * Clears the cached result for `resource`. If called without an argument, clears
   * all cached entries and cancels deduplication of any in-flight requests.
   */
  invalidate(resource?: string): void;
  /**
   * Resolves when the current user has the given resource granted.
   * Throws `AdminUiSdkPermissionDeniedError` if denied.
   * Always throws `AdminUiSdkPermissionError` on 401, regardless of `denyOnError`.
   */
  require(resource: string): Promise<void>;
}
