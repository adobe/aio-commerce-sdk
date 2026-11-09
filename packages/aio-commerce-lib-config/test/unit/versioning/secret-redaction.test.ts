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

import { describe, expect, it } from "vitest";

import {
  isSensitiveField,
  REDACTED_VALUE,
  redactSensitiveConfig,
  redactSensitiveDiffs,
} from "#modules/versioning/secret-redaction";

import type { ConfigDiff } from "#modules/versioning/types";

describe("history secret redaction", () => {
  it.each([
    "password",
    "API_KEY",
    "access-token",
    "clientSecret",
    "oauth",
    "credential",
  ])("redacts the sensitive name %s", (name) => {
    expect(isSensitiveField(name)).toBe(true);
    expect(
      redactSensitiveConfig([
        {
          name,
          origin: { code: "global", level: "global" },
          value: "sensitive",
        },
      ]).at(0)?.value,
    ).toBe(REDACTED_VALUE);
  });

  it("redacts schema password fields even when their names are innocuous", () => {
    const fields = new Set(["pin"]);
    expect(isSensitiveField("pin", fields)).toBe(true);
    expect(
      redactSensitiveConfig(
        [
          {
            name: "pin",
            origin: { code: "global", level: "global" },
            value: "sensitive",
          },
        ],
        fields,
      ).at(0)?.value,
    ).toBe(REDACTED_VALUE);
  });

  it("preserves absent diff values, origins and non-sensitive typed values", () => {
    const diffs: ConfigDiff[] = [
      { name: "api_key", newValue: "sensitive", type: "added" },
      {
        name: "pin",
        oldOrigin: { code: "base", level: "website" },
        oldValue: "sensitive",
        type: "removed",
      },
      { name: "enabled", newValue: true, oldValue: false, type: "modified" },
      { name: "choices", newValue: ["one", "two"], type: "added" },
    ];
    const before = structuredClone(diffs);
    const result = redactSensitiveDiffs(diffs, new Set(["pin"]));
    expect(result.at(0)).toMatchObject({
      newValue: REDACTED_VALUE,
      oldValue: undefined,
    });
    expect(result.at(1)).toMatchObject({
      newValue: undefined,
      oldOrigin: { code: "base", level: "website" },
      oldValue: REDACTED_VALUE,
    });
    expect(result.slice(2)).toEqual(diffs.slice(2));
    expect(diffs).toEqual(before);
  });
});
