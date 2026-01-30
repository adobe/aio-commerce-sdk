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

/** biome-ignore-all lint/suspicious/useAwait: It's a mock */

import { vi } from "vitest";

import type { AdobeState } from "@adobe/aio-lib-state";

/**
 * Creates a mock AdobeState instance for testing.
 * Uses an in-memory Map to simulate state storage.
 */
export function createMockAdobeState(): AdobeState {
  const storage = new Map<string, string>();

  return {
    get: vi.fn(async (key: string) => {
      const value = storage.get(key) ?? null;
      return { value };
    }),
    put: vi.fn(
      async (key: string, value: string, _options?: { ttl?: number }) => {
        storage.set(key, value);
        return key;
      },
    ),
    delete: vi.fn(async (key: string) => {
      storage.delete(key);
      return key;
    }),
    deleteAll: vi.fn(async () => {
      storage.clear();
      return true;
    }),
    stats: vi.fn(async () => ({ keys: storage.size })),
    list: vi.fn(async () => ({ keys: Array.from(storage.keys()) })),
    any: vi.fn(async () => storage.size > 0),
  } as unknown as AdobeState;
}
