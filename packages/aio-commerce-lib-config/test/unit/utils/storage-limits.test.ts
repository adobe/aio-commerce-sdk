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
  getValueSize,
  isWithinStateSizeLimit,
  StorageLimitExceededError,
  shouldArchive,
} from "#index";
import {
  ARCHIVE_SIZE_THRESHOLD,
  MAX_HISTORY_SIZE,
  serializeHistory,
} from "#utils/history-storage";

import type { ConfigVersion } from "#index";

describe("serialized storage limits", () => {
  it("measures UTF-8 bytes rather than JavaScript character count", () => {
    expect(getValueSize(String.fromCodePoint(0x1_f6_42))).toBe(6);
  });
  it("accepts exactly 1 MiB for State and rejects the next byte", () => {
    expect(isWithinStateSizeLimit("x".repeat(1024 * 1024 - 2))).toBe(true);
    expect(isWithinStateSizeLimit("x".repeat(1024 * 1024 - 1))).toBe(false);
  });
  it("accepts exactly 10 MiB for history and rejects the next byte", () => {
    expect(serializeHistory("x".repeat(MAX_HISTORY_SIZE - 2))).toHaveLength(
      MAX_HISTORY_SIZE,
    );
    expect(() => serializeHistory("x".repeat(MAX_HISTORY_SIZE - 1))).toThrow(
      StorageLimitExceededError,
    );
  });
  it("archives at exactly 900 KiB, not one byte below the threshold", () => {
    const entry = {
      name: "padding",
      origin: { code: "global", level: "global" },
      value: "",
    };
    const base: ConfigVersion = {
      diff: [],
      id: "version",
      previousVersionId: null,
      scope: { code: "global", id: "global-id", level: "global" },
      snapshot: [entry],
      timestamp: new Date().toISOString(),
      versionNumber: 1,
    };
    const padding = ARCHIVE_SIZE_THRESHOLD - getValueSize(base);
    const below = {
      ...base,
      snapshot: [{ ...entry, value: "x".repeat(padding - 1) }],
    };
    const exact = {
      ...base,
      snapshot: [{ ...entry, value: "x".repeat(padding) }],
    };
    expect(getValueSize(below)).toBe(ARCHIVE_SIZE_THRESHOLD - 1);
    expect(getValueSize(exact)).toBe(ARCHIVE_SIZE_THRESHOLD);
    expect(shouldArchive(below)).toEqual({ reason: null, should: false });
    expect(shouldArchive(exact)).toEqual({ reason: "size", should: true });
  });
  it("throws on unserializable input rather than reporting a negative or valid size", () => {
    const circular: { self?: object } = {};
    circular.self = circular;
    expect(() => getValueSize(circular)).toThrow();
    expect(() => getValueSize(undefined)).toThrow("cannot be serialized");
  });
  it("preserves size and limit information on the public error", () => {
    const error = new StorageLimitExceededError(101, 100);
    expect(error).toMatchObject({
      limit: 100,
      name: "StorageLimitExceededError",
      valueSize: 101,
    });
  });
});
