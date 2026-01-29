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

/** Returns the current time as an ISO string. */
export function nowIsoString(): string {
  return new Date().toISOString();
}

/** Sets a value at a nested path in the data object. */
export function setAtPath(
  data: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  const lastKey = path.at(-1);
  if (!lastKey) {
    return;
  }

  let current = data;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    current[key] ??= {};
    current = current[key] as Record<string, unknown>;
  }
  current[lastKey] = value;
}

/** Gets a value at a nested path in the data object. */
export function getAtPath(data: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = data;
  for (const key of path) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

