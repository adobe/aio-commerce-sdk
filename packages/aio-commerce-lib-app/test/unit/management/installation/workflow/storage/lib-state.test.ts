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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { createLibStateStore } from "#management/installation/workflow/storage/lib-state";
import { createMockInProgressState } from "#test/fixtures/installation";
import { createMockAdobeState } from "#test/mocks/lib-state";

import type { AdobeState } from "@adobe/aio-lib-state";

// Mock the @adobe/aio-lib-state module
let mockStateInstance: AdobeState;

vi.mock("@adobe/aio-lib-state", () => ({
  init: vi.fn(async () => mockStateInstance),
}));

describe("createLibStateStore", () => {
  beforeEach(() => {
    mockStateInstance = createMockAdobeState();
    vi.clearAllMocks();
  });

  test("should create a store with default TTL", async () => {
    const store = await createLibStateStore();

    expect(store).toBeDefined();
    expect(store.get).toBeDefined();
    expect(store.save).toBeDefined();
  });

  test("should create a store with custom TTL", async () => {
    const customTtl = 7200; // 2 hours
    const store = await createLibStateStore({ ttlSeconds: customTtl });
    const state = createMockInProgressState();

    await store.save(state);
    expect(mockStateInstance.put).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { ttl: customTtl },
    );
  });
});

describe("LibStateStore.get", () => {
  beforeEach(() => {
    mockStateInstance = createMockAdobeState();
    vi.clearAllMocks();
  });

  test("should return null when installation state does not exist", async () => {
    const store = await createLibStateStore();
    const result = await store.get("non-existent-id");

    expect(result).toBeNull();
    expect(mockStateInstance.get).toHaveBeenCalledWith(
      "installation-non-existent-id",
    );
  });

  test("should return installation state when it exists", async () => {
    const store = await createLibStateStore();
    const state = createMockInProgressState();

    await store.save(state);
    const result = await store.get(state.installationId);

    expect(result).toEqual(state);
  });

  test("should return null when stored value is invalid JSON", async () => {
    const store = await createLibStateStore();

    // Manually put invalid JSON into the mock state
    await mockStateInstance.put("installation:bad-json", "not-valid-json{");
    const result = await store.get("bad-json");

    expect(result).toBeNull();
  });

  test("should use correct key prefix for state lookup", async () => {
    const store = await createLibStateStore();
    await store.get("my-installation-id");

    expect(mockStateInstance.get).toHaveBeenCalledWith(
      "installation-my-installation-id",
    );
  });
});

describe("LibStateStore.save", () => {
  beforeEach(() => {
    mockStateInstance = createMockAdobeState();
    vi.clearAllMocks();
  });

  test("should save installation state with correct key", async () => {
    const store = await createLibStateStore();
    const state = createMockInProgressState({
      installationId: "save-test-id",
    });

    await store.save(state);

    expect(mockStateInstance.put).toHaveBeenCalledWith(
      "installation-save-test-id",
      JSON.stringify(state),
      expect.objectContaining({ ttl: expect.any(Number) }),
    );
  });

  test("should use default TTL of 3 hours (10800 seconds)", async () => {
    const store = await createLibStateStore();
    const state = createMockInProgressState();

    await store.save(state);
    expect(mockStateInstance.put).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { ttl: 3 * 60 * 60 }, // 3 hours in seconds
    );
  });

  test("should serialize state as JSON", async () => {
    const store = await createLibStateStore();
    const state = createMockInProgressState({
      data: { nested: { value: 123 } },
    });

    await store.save(state);
    const savedValue = vi.mocked(mockStateInstance.put).mock.calls[0][1];

    expect(JSON.parse(savedValue)).toEqual(state);
  });
});
