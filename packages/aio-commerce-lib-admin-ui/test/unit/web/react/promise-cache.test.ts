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

import { describe, expect, test, vi } from "vitest";

import { createRetryablePromiseCache } from "#web/react/promise-cache";

import type { Result } from "#web/react/types";

describe("createRetryablePromiseCache", () => {
  test("returns the identical promise for the same key and runs create once", () => {
    const cache = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = cache.get("key", create);
    const second = cache.get("key", create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("creates separate promises for different keys", () => {
    const cache = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = cache.get("first", create);
    const second = cache.get("second", create);

    expect(second).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("keeps a resolved promise cached", async () => {
    const cache = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = cache.get("key", create);
    await expect(first).resolves.toBe("value");

    const second = cache.get("key", create);
    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("keeps a rejected promise cached until it is evicted", async () => {
    const cache = createRetryablePromiseCache<string>();
    const create = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    const first = cache.get("key", create);
    await expect(first).rejects.toThrow("boom");

    // The rejection stays cached, so a later lookup replays it without re-running create.
    const second = cache.get("key", create);
    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);

    // evictIfFailed drops the failed entry, so the next lookup retries.
    cache.evictIfFailed("key");
    const third = cache.get("key", create);

    expect(third).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);

    await expect(third).resolves.toBe("recovered");
  });

  test("evictIfFailed keeps a successful promise", async () => {
    const cache = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = cache.get("key", create);
    await expect(first).resolves.toBe("value");

    cache.evictIfFailed("key");
    const second = cache.get("key", create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("evicts a fulfilled value classified as a failure", async () => {
    const cache = createRetryablePromiseCache<Result<string>>(
      ({ error }) => error !== null,
    );
    const create = vi
      .fn<() => Promise<Result<string>>>()
      .mockResolvedValueOnce({ data: null, error: new Error("boom") })
      .mockResolvedValueOnce({ data: "recovered", error: null });

    const first = cache.get("key", create);
    await expect(first).resolves.toEqual({
      data: null,
      error: new Error("boom"),
    });

    cache.evictIfFailed("key");
    const second = cache.get("key", create);

    expect(second).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
    await expect(second).resolves.toEqual({
      data: "recovered",
      error: null,
    });
  });
});
