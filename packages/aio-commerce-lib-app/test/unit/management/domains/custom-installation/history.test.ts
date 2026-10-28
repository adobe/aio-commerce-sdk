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

import { readRunHistory } from "#management/domains/custom-installation/history";
import { createMockConfig } from "#test/fixtures/config";

const FIRST = { name: "First", script: "./first.js" };
const SECOND = { name: "Second Step", script: "./second.js" };
const THIRD = { name: "Third", script: "./third.js" };

const config = createMockConfig({
  installation: {
    customInstallationSteps: [
      { ...FIRST, description: "Runs first" },
      { ...SECOND, description: "Runs second" },
    ],
  },
});

describe("readRunHistory", () => {
  test("takes the config's steps as run when nothing is stored", () => {
    expect(readRunHistory(undefined, config)).toEqual([FIRST, SECOND]);
  });

  test("returns no steps when nothing is stored nor installed", () => {
    expect(readRunHistory(undefined, null)).toEqual([]);
  });

  test("returns no steps when the stored data has no step", () => {
    expect(readRunHistory({}, config)).toEqual([]);
  });

  describe("legacy runner records", () => {
    test("reads one record per step and recovers each name from the config", () => {
      const section = {
        first: { data: { ok: true }, script: "./first.js" },
        secondStep: { data: null, script: "./second.js" },
      };

      expect(readRunHistory(section, config)).toEqual([FIRST, SECOND]);
    });

    test("names a step the config no longer declares after its key", () => {
      const section = {
        first: { data: null, script: "./first.js" },
        oldStep: { data: null, script: "./old.js" },
      };

      expect(readRunHistory(section, config)).toEqual([
        FIRST,
        { name: "oldStep", script: "./old.js" },
      ]);
    });

    test("does not mistake a step named Reconciliation for the 2.0 list", () => {
      const reconciliation = {
        name: "Reconciliation",
        script: "./reconciliation.js",
      };

      const section = {
        reconciliation: { data: null, script: "./reconciliation.js" },
      };

      const configWithReconciliation = createMockConfig({
        installation: {
          customInstallationSteps: [
            { ...reconciliation, description: "A step named like the list" },
          ],
        },
      });

      expect(readRunHistory(section, configWithReconciliation)).toEqual([
        reconciliation,
      ]);
    });
  });

  describe("2.0 upgrade list", () => {
    test("reads the steps in the order they ran", () => {
      const section = {
        reconciliation: { executedSteps: [SECOND, FIRST] },
      };

      expect(readRunHistory(section, config)).toEqual([SECOND, FIRST]);
    });

    test("merges the list with the legacy runner records without duplicates", () => {
      const section = {
        first: { data: null, script: "./first.js" },
        reconciliation: { executedSteps: [FIRST, SECOND, THIRD] },
        secondStep: { data: null, script: "./second.js" },
      };

      expect(readRunHistory(section, config)).toEqual([FIRST, SECOND, THIRD]);
    });

    test("leaves out a listed step that was uninstalled", () => {
      const section = {
        first: null,
        reconciliation: { executedSteps: [FIRST, SECOND] },
      };

      expect(readRunHistory(section, config)).toEqual([SECOND]);
    });
  });

  describe("per-step records", () => {
    test("reads the steps in the order they were stored", () => {
      // Biome sorts the keys of object literals, which would hide the order under test.
      const section = Object.fromEntries([
        ["secondStep", SECOND],
        ["first", FIRST],
      ]);

      expect(readRunHistory(section, config)).toEqual([SECOND, FIRST]);
    });

    test("leaves out steps that were uninstalled", () => {
      const section = {
        first: null,
        secondStep: SECOND,
      };

      expect(readRunHistory(section, config)).toEqual([SECOND]);
    });
  });
});
