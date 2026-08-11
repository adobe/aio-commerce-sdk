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

import stringify from "safe-stable-stringify";

import type { CleanupResource } from "#management/common/workflow/resource";

/** Adds cleanup resources without duplicating an existing path and identity. */
export function mergeCleanupResources(
  current: CleanupResource[],
  added: CleanupResource[],
): CleanupResource[] {
  const resourceKeys = new Set(current.map(getCleanupResourceKey));
  const merged = [...current];

  for (const resource of added) {
    const resourceKey = getCleanupResourceKey(resource);
    if (resourceKeys.has(resourceKey)) {
      continue;
    }

    resourceKeys.add(resourceKey);
    merged.push(resource);
  }

  return merged;
}

/** Removes cleanup resources resolved by a completed plan execution. */
export function removeResolvedCleanupResources(
  current: CleanupResource[],
  resolved: CleanupResource[],
): CleanupResource[] {
  const resolvedResourceKeys = new Set(resolved.map(getCleanupResourceKey));
  return current.filter(
    (resource) => !resolvedResourceKeys.has(getCleanupResourceKey(resource)),
  );
}

/** Returns a stable key for a cleanup resource's full path and identity. */
function getCleanupResourceKey(
  resource: CleanupResource,
): ReturnType<typeof stringify> {
  return stringify({ identity: resource.identity, path: resource.path });
}
