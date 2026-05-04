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
  check(resource: string): Promise<boolean>;
  invalidate(resource?: string): void;
  require(resource: string): Promise<void>;
}

/** Parameters for wrapping a runtime action with an Admin UI SDK permission check. */
export type WithAdminUiSdkPermissionParams<
  TParams = Record<string, unknown>,
  TResult = unknown,
> = {
  resource: string;
  client: AdminUiSdkPermissionClient;
  handler: (params: TParams) => Promise<TResult>;
};
