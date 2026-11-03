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

import type {
  ResourceChange,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { AdminUiOperationValue } from "./types";

/**
 * Maps the component operations of an `adminUi` diff, which compares the baseline and target config
 * only, to config changes.
 *
 * @param operations - The result of `diffComponents`.
 */
export function toAdminUiChanges(
  operations: readonly ResourceOperation<AdminUiOperationValue>[],
): ResourceChange[] {
  return operations.flatMap(({ itemRefs, kind }) =>
    itemRefs.map((itemRef) => ({ itemRef, key: itemRef.key, kind })),
  );
}
