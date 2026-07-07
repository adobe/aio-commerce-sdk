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

describe("createRetryablePromiseCache", () => {
  test("returns the identical promise for the same key and runs create once", () => {
    const getOrCreate = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = getOrCreate("key", create);
    const second = getOrCreate("key", create);

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("creates separate promises for different keys", () => {
    const getOrCreate = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = getOrCreate("first", create);
    const second = getOrCreate("second", create);

    expect(second).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("keeps a resolved promise cached", async () => {
    const getOrCreate = createRetryablePromiseCache<string>();
    const create = vi.fn(() => Promise.resolve("value"));

    const first = getOrCreate("key", create);
    await expect(first).resolves.toBe("value");

    const second = getOrCreate("key", create);
    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("evicts a rejected promise so the next lookup retries", async () => {
    const getOrCreate = createRetryablePromiseCache<string>();
    const create = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    const first = getOrCreate("key", create);
    await expect(first).rejects.toThrow("boom");

    const second = getOrCreate("key", create);
    expect(second).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);

    await expect(second).resolves.toBe("recovered");
  });
});
