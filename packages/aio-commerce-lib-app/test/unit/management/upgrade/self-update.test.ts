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

import {
  buildAutoUpdatePlan,
  classifyAutoUpdate,
} from "#management/upgrade/self-update";

import type { ResourceChange } from "#management/upgrade/types";

const UUID_LIKE_PATTERN = /[0-9a-f-]{36}/;

const change = (over: Partial<ResourceChange>): ResourceChange => ({
  after: undefined,
  before: undefined,
  destructive: false,
  domain: "customStep",
  identity: "x",
  kind: "changed",
  supported: true,
  ...over,
});

describe("classifyAutoUpdate", () => {
  test("empty plan is a noop", () => {
    expect(classifyAutoUpdate({ changes: [] })).toBe("noop");
    expect(
      classifyAutoUpdate({ changes: [change({ kind: "unchanged" })] }),
    ).toBe("noop");
  });
  test("an unsupported changed resource is unsupported (beats destructive)", () => {
    expect(
      classifyAutoUpdate({
        changes: [
          change({
            destructive: true,
            domain: "commerceWebhook",
            kind: "changed",
            supported: false,
          }),
        ],
      }),
    ).toBe("unsupported");
  });
  test("a destructive (but supported) change is review-required", () => {
    expect(
      classifyAutoUpdate({
        changes: [
          change({
            destructive: true,
            domain: "ioEventsRegistration",
            kind: "removed",
            supported: true,
          }),
        ],
      }),
    ).toBe("review-required");
  });
  test("a plain supported change reconciles", () => {
    expect(classifyAutoUpdate({ changes: [change({ kind: "added" })] })).toBe(
      "reconcile",
    );
  });
});

test("buildAutoUpdatePlan stamps a fresh planId + deploymentVersion", () => {
  const diff = { changes: [change({ kind: "added" })] };
  const target = { metadata: { version: "1.2.0" } } as never;
  const plan = buildAutoUpdatePlan(diff, target, "77");
  expect(plan.deploymentVersion).toBe("77");
  expect(plan.diff).toBe(diff);
  expect(plan.targetConfig).toBe(target);
  expect(plan.planId).toMatch(UUID_LIKE_PATTERN);
  expect(typeof plan.createdAt).toBe("string");
});
