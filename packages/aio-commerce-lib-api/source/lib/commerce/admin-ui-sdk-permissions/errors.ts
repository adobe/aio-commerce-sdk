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

/** Base error for Admin UI SDK permission helper failures. */
export class AdminUiSdkPermissionError extends CommerceSdkErrorBase {}

/** Error thrown when the current user is denied access to an Admin UI SDK ACL resource. */
export class AdminUiSdkPermissionDeniedError extends AdminUiSdkPermissionError {
  public readonly resource: string;

  public constructor(resource: string, options?: { traceId?: string }) {
    super(`Admin UI SDK permission denied for resource: ${resource}`, options);
    this.resource = resource;
  }
}
