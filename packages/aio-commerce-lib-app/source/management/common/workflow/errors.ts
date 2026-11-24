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
import type { WorkflowError } from "./types";

/**
 * Thrown when a planned step fails, carrying the error reported for it and for each of its
 * ancestors.
 */
export class PlannedStepError extends CommerceSdkErrorBase {
  public readonly workflowError: WorkflowError;

  public constructor(
    workflowError: WorkflowError,
    options?: CommerceSdkErrorBaseOptions,
  ) {
    super(workflowError.message ?? workflowError.key, options);
    this.workflowError = workflowError;
  }
}
