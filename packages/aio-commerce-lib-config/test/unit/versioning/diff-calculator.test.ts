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

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  applyDiff,
  calculateDiff,
  invertDiff,
} from "#modules/versioning/diff-calculator";

import type { ConfigValue } from "#modules/configuration/types";

const configArbitrary = fc.uniqueArray(
  fc.record({
    name: fc.string(),
    origin: fc.record({ code: fc.string(), level: fc.string() }),
    value: fc.oneof(
      fc.string(),
      fc.boolean(),
      fc.array(fc.string()),
      fc.constant(undefined),
    ),
  }),
  { maxLength: 20, selector: (item) => item.name },
);

function normalized(config: ConfigValue[]) {
  return config.toSorted((a, b) => {
    if (a.name === b.name) {
      return 0;
    }
    return a.name < b.name ? -1 : 1;
  });
}

describe("configuration diff properties", () => {
  it("reconstructs both snapshots, including origins, without mutating its inputs", () => {
    fc.assert(
      fc.property(configArbitrary, configArbitrary, (before, after) => {
        const savedBefore = structuredClone(before);
        const savedAfter = structuredClone(after);
        const changes = calculateDiff(before, after);
        expect(normalized(applyDiff(before, changes))).toEqual(
          normalized(after),
        );
        expect(normalized(applyDiff(after, invertDiff(changes)))).toEqual(
          normalized(before),
        );
        expect(calculateDiff(before, before)).toEqual([]);
        expect(before).toEqual(savedBefore);
        expect(after).toEqual(savedAfter);
      }),
      { numRuns: 1000, seed: 6076 },
    );
  });

  it("distinguishes an absent field from an existing undefined value", () => {
    const before: ConfigValue[] = [
      {
        name: "setting",
        origin: { code: "global", level: "global" },
        value: undefined,
      },
    ];
    const after = [
      {
        ...before.at(0),
        name: "setting",
        origin: { code: "global", level: "global" },
        value: "value",
      },
    ];
    expect(calculateDiff(before, after)).toMatchObject([
      { name: "setting", type: "modified" },
    ]);
  });

  it("records origin-only changes and restores removed origins", () => {
    const before: ConfigValue[] = [
      {
        name: "setting",
        origin: { code: "base", level: "website" },
        value: ["one"],
      },
      {
        name: "removed",
        origin: { code: "global", level: "global" },
        value: false,
      },
    ];
    const after: ConfigValue[] = [
      {
        name: "setting",
        origin: { code: "default", level: "store_view" },
        value: ["one"],
      },
    ];
    const changes = calculateDiff(before, after);
    expect(changes).toHaveLength(2);
    expect(normalized(applyDiff(after, invertDiff(changes)))).toEqual(
      normalized(before),
    );
  });
});
