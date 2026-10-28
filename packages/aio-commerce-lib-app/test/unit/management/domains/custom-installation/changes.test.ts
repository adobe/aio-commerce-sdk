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

import { planCustomScriptChanges } from "#management/domains/custom-installation/changes";
import { createMockMetadata } from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const step = (name: string, script = "./a.js") => ({
  description: name,
  name,
  script,
});

function config(
  ...steps: ReturnType<typeof step>[]
): CommerceAppConfigOutputModel {
  return {
    installation: { customInstallationSteps: steps },
    metadata: createMockMetadata("app"),
  };
}

describe("planCustomScriptChanges", () => {
  test.each([
    {
      baseline: null,
      expected: ["add"],
      name: "adds a declared step without a baseline",
      target: config(step("One")),
    },
    {
      baseline: config(step("One")),
      expected: ["remove"],
      name: "removes a declared step without a target",
      target: null,
    },
    {
      baseline: config(step("One")),
      expected: ["remove"],
      name: "removes a step the target no longer declares",
      target: config(step("Two")),
    },
    {
      baseline: config(step("One")),
      expected: ["add"],
      name: "adds a step only the target declares",
      stepName: "Other",
      target: config(step("Other"), step("One")),
    },
    {
      baseline: config(step("One")),
      expected: [],
      name: "ignores an unchanged step",
      target: config(step("One")),
    },
    {
      baseline: config(step("One")),
      expected: [],
      name: "ignores a step whose script changed, since it does not run again",
      target: config(step("One", "./b.js")),
    },
    {
      baseline: null,
      expected: [],
      name: "has no change without either config",
      target: null,
    },
  ])("$name", ({ baseline, target, expected, stepName }) => {
    const changes = planCustomScriptChanges(
      stepName ?? "One",
      baseline,
      target,
    );

    expect(changes.map((change) => change.kind)).toEqual(expected);
    for (const change of changes) {
      expect(change.itemRef.key).toBe(change.key);
    }
  });
});
