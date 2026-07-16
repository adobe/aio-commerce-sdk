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

const DEFAULT_MESSAGE =
  "No association record was found for this app. Re-associate the app to resolve this error.";

/** Options accepted by {@link AssociationRecordNotFoundError}. */
// Aliased to `CommerceSdkErrorBaseOptions` for now; kept as a named seam so
// future error-specific options can be added without changing the constructor
// contract.
type AssociationRecordNotFoundErrorOptions = CommerceSdkErrorBaseOptions;

/**
 * Thrown when a runtime action needs the app's stored association record but it
 * is missing or incomplete — for example, when the app has never been
 * associated, has been unassociated, or was associated by an older SDK that did
 * not store the data being read.
 *
 * Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceClient, AssociationRecordNotFoundError } from "@adobe/aio-commerce-lib-app";
 * import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
 *
 * try {
 *   const client = await getCommerceClient(resolveImsAuthParams(params));
 *   // ... use client
 * } catch (error) {
 *   if (error instanceof AssociationRecordNotFoundError) {
 *     // handle the unassociated case (e.g. return a 400 response)
 *   }
 *   throw error;
 * }
 * ```
 */
export class AssociationRecordNotFoundError extends CommerceSdkErrorBase {
  public constructor(
    message: string = DEFAULT_MESSAGE,
    options?: AssociationRecordNotFoundErrorOptions,
  ) {
    super(message, options);
  }
}
