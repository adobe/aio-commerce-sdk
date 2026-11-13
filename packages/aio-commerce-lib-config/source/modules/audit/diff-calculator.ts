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

import { isDeepStrictEqual } from "node:util";

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigDiff } from "./types";

/** Calculates value and origin changes between scope-local overrides. */
export function calculateDiff(
  before: ConfigValue[],
  after: ConfigValue[],
): ConfigDiff[] {
  const previous = new Map(before.map((item) => [item.name, item]));
  const current = new Map(after.map((item) => [item.name, item]));
  const changes: ConfigDiff[] = [];

  for (const [name, item] of current) {
    const old = previous.get(name);
    if (!old) {
      changes.push({
        name,
        newOrigin: item.origin,
        newValue: item.value,
        type: "added",
      });
    } else if (!isDeepStrictEqual(old, item)) {
      changes.push({
        name,
        newOrigin: item.origin,
        newValue: item.value,
        oldOrigin: old.origin,
        oldValue: old.value,
        type: "modified",
      });
    }
  }
  for (const [name, item] of previous) {
    if (!current.has(name)) {
      changes.push({
        name,
        oldOrigin: item.origin,
        oldValue: item.value,
        type: "removed",
      });
    }
  }
  return changes;
}
