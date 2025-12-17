/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expect, it } from "vitest";

import { applyDiff, calculateDiff } from "#modules/versioning/diff-calculator";

import type { ConfigValue } from "#modules/configuration/types";

// Helper to cast values to ConfigValue type
const asConfigValue = (value: unknown) => value as ConfigValue["value"];

describe("Diff Calculator", () => {
  describe("calculateDiff", () => {
    it("should detect added fields", () => {
      const oldConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field2",
          value: "value2",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(oldConfig, newConfig);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        name: "field2",
        newValue: "value2",
        type: "added",
      });
    });

    it("should detect modified fields", () => {
      const oldConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "old-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "new-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(oldConfig, newConfig);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        name: "field1",
        oldValue: "old-value",
        newValue: "new-value",
        type: "modified",
      });
    });

    it("should detect removed fields", () => {
      const oldConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field2",
          value: "value2",
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(oldConfig, newConfig);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        name: "field2",
        oldValue: "value2",
        type: "removed",
      });
    });

    it("should detect multiple changes", () => {
      const oldConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field2",
          value: "value2",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field3",
          value: "value3",
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "modified-value",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field3",
          value: "value3",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field4",
          value: "new-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(oldConfig, newConfig);

      expect(diff).toHaveLength(3);

      const modifiedDiff = diff.find((d) => d.type === "modified");
      expect(modifiedDiff).toEqual({
        name: "field1",
        oldValue: "value1",
        newValue: "modified-value",
        type: "modified",
      });

      const addedDiff = diff.find((d) => d.type === "added");
      expect(addedDiff).toEqual({
        name: "field4",
        newValue: "new-value",
        type: "added",
      });

      const removedDiff = diff.find((d) => d.type === "removed");
      expect(removedDiff).toEqual({
        name: "field2",
        oldValue: "value2",
        type: "removed",
      });
    });

    it("should return empty diff for identical configs", () => {
      const config: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(config, config);

      expect(diff).toHaveLength(0);
    });

    it("should handle different value types", () => {
      const oldConfig: ConfigValue[] = [
        {
          name: "number_field",
          value: asConfigValue(100),
          origin: { code: "global", level: "global" },
        },
        {
          name: "boolean_field",
          value: asConfigValue(false),
          origin: { code: "global", level: "global" },
        },
      ];

      const newConfig: ConfigValue[] = [
        {
          name: "number_field",
          value: asConfigValue(200),
          origin: { code: "global", level: "global" },
        },
        {
          name: "boolean_field",
          value: asConfigValue(true),
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = calculateDiff(oldConfig, newConfig);

      expect(diff).toHaveLength(2);
      expect(diff[0].oldValue).toBe(100);
      expect(diff[0].newValue).toBe(200);
      expect(diff[1].oldValue).toBe(false);
      expect(diff[1].newValue).toBe(true);
    });
  });

  describe("applyDiff", () => {
    it("should apply added fields", () => {
      const baseConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = [
        {
          name: "field2",
          newValue: "value2",
          type: "added" as const,
        },
      ];

      const result = applyDiff(baseConfig, diff);

      expect(result).toHaveLength(2);
      expect(result.find((f) => f.name === "field2")?.value).toBe("value2");
    });

    it("should apply modified fields", () => {
      const baseConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "old-value",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = [
        {
          name: "field1",
          oldValue: "old-value",
          newValue: "new-value",
          type: "modified" as const,
        },
      ];

      const result = applyDiff(baseConfig, diff);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("new-value");
    });

    it("should apply removed fields", () => {
      const baseConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field2",
          value: "value2",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = [
        {
          name: "field2",
          oldValue: "value2",
          type: "removed" as const,
        },
      ];

      const result = applyDiff(baseConfig, diff);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("field1");
    });

    it("should apply multiple changes correctly", () => {
      const baseConfig: ConfigValue[] = [
        {
          name: "field1",
          value: "value1",
          origin: { code: "global", level: "global" },
        },
        {
          name: "field2",
          value: "value2",
          origin: { code: "global", level: "global" },
        },
      ];

      const diff = [
        {
          name: "field1",
          oldValue: "value1",
          newValue: "modified",
          type: "modified" as const,
        },
        {
          name: "field2",
          oldValue: "value2",
          type: "removed" as const,
        },
        {
          name: "field3",
          newValue: "new",
          type: "added" as const,
        },
      ];

      const result = applyDiff(baseConfig, diff);

      expect(result).toHaveLength(2);
      expect(result.find((f) => f.name === "field1")?.value).toBe("modified");
      expect(result.find((f) => f.name === "field3")?.value).toBe("new");
      expect(result.find((f) => f.name === "field2")).toBeUndefined();
    });
  });
});
