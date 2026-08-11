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

import { describe, expect, test } from "vitest";

import { classifyAutoUpdate } from "#management/upgrade/self-update";

import type { ConfigDiff, ResourceChange } from "#management/upgrade/types";

function change(overrides: Partial<ResourceChange>): ResourceChange {
  return {
    destructive: false,
    domain: "d",
    identity: "i",
    kind: "added",
    supported: true,
    ...overrides,
  };
}

function diff(...changes: ResourceChange[]): ConfigDiff {
  return { changes };
}

describe("classifyAutoUpdate", () => {
  test("empty plan → noop", () => {
    expect(classifyAutoUpdate(diff())).toBe("noop");
    expect(classifyAutoUpdate(diff(change({ kind: "unchanged" })))).toBe(
      "noop",
    );
  });

  test("supported additive changes → reconcile", () => {
    expect(classifyAutoUpdate(diff(change({ kind: "added" })))).toBe(
      "reconcile",
    );
  });

  test("a destructive (but supported) removal → review-required", () => {
    expect(
      classifyAutoUpdate(diff(change({ destructive: true, kind: "removed" }))),
    ).toBe("review-required");
  });

  test("an unsupported change → unsupported", () => {
    expect(
      classifyAutoUpdate(diff(change({ kind: "changed", supported: false }))),
    ).toBe("unsupported");
  });

  test("unsupported outranks destructive", () => {
    expect(
      classifyAutoUpdate(
        diff(
          change({ destructive: true, kind: "removed" }),
          change({ kind: "changed", supported: false }),
        ),
      ),
    ).toBe("unsupported");
  });
});
