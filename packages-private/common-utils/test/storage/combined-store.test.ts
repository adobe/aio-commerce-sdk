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

import { createCombinedStore } from "#storage/combined-store";

import type { KeyValueStore } from "#storage/types";

const stores = vi.hoisted(() => ({
  cache: undefined as unknown as KeyValueStore<string>,
  persistent: undefined as unknown as KeyValueStore<string>,
}));

vi.mock("#storage/state-store", () => ({
  createStateStore: () => Promise.resolve(stores.cache),
}));

vi.mock("#storage/files-store", () => ({
  createFilesStore: () => Promise.resolve(stores.persistent),
}));

/** An in-memory store whose calls can be made to fail. */
function memoryStore(): KeyValueStore<string> & {
  values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    delete: vi.fn(async (key: string) => values.delete(key) || true),
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    has: vi.fn(async (key: string) => values.has(key)),
    put: vi.fn((key: string, data: string) => {
      values.set(key, data);
      return Promise.resolve();
    }),
    values,
  };
}

describe("createCombinedStore", () => {
  let cache: ReturnType<typeof memoryStore>;
  let persistent: ReturnType<typeof memoryStore>;

  beforeEach(() => {
    cache = memoryStore();
    persistent = memoryStore();
    stores.cache = cache;
    stores.persistent = persistent;
  });

  test("leaves the cache unchanged when the persistent write fails", async () => {
    cache.values.set("key", "old");
    vi.mocked(persistent.put).mockRejectedValueOnce(new Error("files down"));
    const store = await createCombinedStore<string>();

    await expect(store.put("key", "new")).rejects.toThrow("files down");
    expect(cache.values.get("key")).toBe("old");
  });

  test("drops the cached value when the cache write fails, so reads fall back to the persisted one", async () => {
    cache.values.set("key", "old");
    vi.mocked(cache.put).mockRejectedValueOnce(new Error("state down"));
    const store = await createCombinedStore<string>();

    await store.put("key", "new");

    expect(await store.get("key")).toBe("new");
  });

  test("fails when the cache can neither be written nor cleared", async () => {
    vi.mocked(cache.put).mockRejectedValueOnce(new Error("state down"));
    vi.mocked(cache.delete).mockResolvedValueOnce(false);
    const store = await createCombinedStore<string>();

    await expect(store.put("key", "new")).rejects.toThrow("state down");
  });

  test("reads the cache first", async () => {
    cache.values.set("key", "cached");
    persistent.values.set("key", "persisted");
    const store = await createCombinedStore<string>();

    expect(await store.get("key")).toBe("cached");
    expect(persistent.get).not.toHaveBeenCalled();
  });

  test("falls back to the persisted value and caches it, ignoring a failed cache write", async () => {
    persistent.values.set("key", "persisted");
    vi.mocked(cache.put).mockRejectedValueOnce(new Error("state down"));
    const store = await createCombinedStore<string>();

    expect(await store.get("key")).toBe("persisted");
    expect(await store.get("key")).toBe("persisted");
    expect(cache.values.get("key")).toBe("persisted");
  });

  test("returns null when neither store has the key", async () => {
    const store = await createCombinedStore<string>();
    expect(await store.get("key")).toBeNull();
  });

  test("only caches values the predicate does not persist", async () => {
    const store = await createCombinedStore<string>({
      persistent: { shouldPersist: (data) => data !== "draft" },
    });

    await store.put("key", "draft");

    expect(persistent.put).not.toHaveBeenCalled();
    expect(cache.values.get("key")).toBe("draft");
  });

  test("deletes from both stores", async () => {
    cache.values.set("key", "cached");
    persistent.values.set("key", "persisted");
    const store = await createCombinedStore<string>();

    expect(await store.delete("key")).toBe(true);
    expect(cache.values.has("key")).toBe(false);
    expect(persistent.values.has("key")).toBe(false);
  });

  test("reports a value stored in either store", async () => {
    persistent.values.set("key", "value");
    const store = await createCombinedStore<string>();

    expect(await store.has("key")).toBe(true);
    expect(await store.has("other")).toBe(false);
  });
});
