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

import { beforeEach, describe, expect, test, vi } from "vitest";

const mockInitState = vi.fn();
const mockInitFiles = vi.fn();

vi.mock("@adobe/aio-lib-state", () => ({
  init: mockInitState,
}));

vi.mock("@adobe/aio-lib-files", () => ({
  init: mockInitFiles,
}));

describe("getSharedState", () => {
  beforeEach(() => {
    vi.resetModules();

    mockInitState.mockReset();
    mockInitState.mockResolvedValue({});
    mockInitFiles.mockReset();
    mockInitFiles.mockResolvedValue({});
  });

  test("defaults to 'amer' when __OW_REGION is not set", async () => {
    const { getSharedState } = await import("#utils/repository");
    await getSharedState();

    expect(mockInitState).toHaveBeenCalledWith({ region: "amer" });
  });

  test.each([
    ["us-east-1", "amer"],
    ["eu-west-1", "emea"],
    ["ap-northeast-1", "apac"],
    ["ap-southeast-2", "aus"],
  ])("maps __OW_REGION '%s' to region '%s'", async (owRegion, expectedRegion) => {
    vi.stubEnv("__OW_REGION", owRegion);
    const { getSharedState } = await import("#utils/repository");
    await getSharedState();

    expect(mockInitState).toHaveBeenCalledWith({ region: expectedRegion });
  });

  test("falls back to 'amer' for an unknown __OW_REGION value", async () => {
    vi.stubEnv("__OW_REGION", "sa-east-1");
    const { getSharedState } = await import("#utils/repository");
    await getSharedState();
    expect(mockInitState).toHaveBeenCalledWith({ region: "amer" });
  });

  test("uses the configured region instead of auto-detection", async () => {
    vi.stubEnv("__OW_REGION", "eu-west-1"); // would map to "emea" if auto-detected
    const { getSharedState, setGlobalStateOptions } = await import(
      "#utils/repository"
    );

    setGlobalStateOptions({ region: "apac" });
    await getSharedState();

    expect(mockInitState).toHaveBeenCalledWith({ region: "apac" });
  });

  test("returns the same instance on subsequent calls (singleton)", async () => {
    const { getSharedState } = await import("#utils/repository");
    const first = await getSharedState();
    const second = await getSharedState();

    expect(first).toBe(second);
    expect(mockInitState).toHaveBeenCalledTimes(1);
  });
});

describe("getSharedFiles", () => {
  beforeEach(() => {
    vi.resetModules();

    mockInitFiles.mockReset();
    mockInitFiles.mockResolvedValue({});
  });

  test("initializes aio-lib-files on first call", async () => {
    const { getSharedFiles } = await import("#utils/repository");
    await getSharedFiles();

    expect(mockInitFiles).toHaveBeenCalledTimes(1);
  });

  test("returns the same instance on subsequent calls (singleton)", async () => {
    const { getSharedFiles } = await import("#utils/repository");
    const first = await getSharedFiles();
    const second = await getSharedFiles();

    expect(first).toBe(second);
    expect(mockInitFiles).toHaveBeenCalledTimes(1);
  });
});
