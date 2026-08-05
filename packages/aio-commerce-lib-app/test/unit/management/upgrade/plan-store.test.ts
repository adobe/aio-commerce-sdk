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

// Mock the underlying storage layer (`aio-lib-state` / `aio-lib-files`) rather
// than `createCombinedStore` itself, so the real storage code path runs and
// the tests exercise actual round-trip storage behavior.
const { state, files, mockState, mockFiles } = vi.hoisted(() => {
  const stateStore = new Map<string, string>();
  const filesStore = new Map<string, string>();

  const stateMock = {
    delete: vi.fn(async (key: string) => {
      stateStore.delete(key);
    }),
    get: vi.fn(async (key: string) => ({
      value: stateStore.get(key) ?? null,
    })),
    put: vi.fn(
      async (key: string, value: string, _options?: { ttl?: number }) => {
        stateStore.set(key, value);
      },
    ),
  };

  const filesMock = {
    delete: vi.fn(async (path: string) => {
      filesStore.delete(path);
    }),
    read: vi.fn(async (path: string) => {
      const content = filesStore.get(path);
      if (content === undefined) {
        throw Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
      }
      return Buffer.from(content);
    }),
    write: vi.fn(async (path: string, content: string | Buffer) => {
      const contentString = content.toString();
      filesStore.set(path, contentString);
      return contentString.length;
    }),
  };

  return {
    files: filesStore,
    mockFiles: filesMock,
    mockState: stateMock,
    state: stateStore,
  };
});

vi.mock("@adobe/aio-lib-state", () => ({
  init: vi.fn(async () => mockState),
  MAX_TTL: 31_536_000,
}));

vi.mock("@adobe/aio-lib-files", () => ({
  init: vi.fn(async () => mockFiles),
}));

import {
  createCleanupStore,
  createPlanStore,
  generatePlanId,
  mergeCleanupEntries,
  PLAN_KEY,
} from "#management/upgrade/plan-store";

import type {
  CleanupEntry,
  CleanupList,
  UpdatePlan,
} from "#management/upgrade/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const makePlan = (planId: string): UpdatePlan => ({
  createdAt: "2026-08-05T00:00:00.000Z",
  deploymentVersion: "1.0.0",
  diff: { changes: [] },
  planId,
  targetConfig: {} as UpdatePlan["targetConfig"],
});

const makeCleanupList = (): CleanupList => ({
  entries: [{ domain: "commerceWebhook", identity: "webhook-1" }],
});

describe("plan-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.clear();
    files.clear();
  });

  test("PLAN_KEY is the single-slot key", () => {
    expect(PLAN_KEY).toBe("current");
  });

  test("stores an update plan and reads it back by key", async () => {
    const store = await createPlanStore();
    const plan = makePlan("plan-1");

    await store.put(PLAN_KEY, plan);

    expect(await store.get(PLAN_KEY)).toEqual(plan);
  });

  test("deleting the plan clears it", async () => {
    const store = await createPlanStore();
    await store.put(PLAN_KEY, makePlan("plan-1"));

    await store.delete(PLAN_KEY);

    expect(await store.get(PLAN_KEY)).toBeNull();
  });

  test("stores a cleanup list and reads it back", async () => {
    const store = await createCleanupStore();
    const cleanup = makeCleanupList();

    await store.put(PLAN_KEY, cleanup);

    expect(await store.get(PLAN_KEY)).toEqual(cleanup);
  });

  test("always persists the plan, even without a completed-like state", async () => {
    const store = await createPlanStore();
    await store.put(PLAN_KEY, makePlan("plan-1"));

    expect(mockFiles.write).toHaveBeenCalled();
  });

  test("generatePlanId returns distinct UUID-shaped strings", () => {
    const first = generatePlanId();
    const second = generatePlanId();

    expect(first).toMatch(UUID_REGEX);
    expect(second).toMatch(UUID_REGEX);
    expect(first).not.toBe(second);
  });

  describe("mergeCleanupEntries", () => {
    test("unions two disjoint entry lists", () => {
      const existing: CleanupEntry[] = [
        { domain: "commerceWebhook", identity: "webhook-1" },
      ];
      const incoming: CleanupEntry[] = [
        { domain: "commerceSubscription", identity: "sub-1" },
      ];

      expect(mergeCleanupEntries(existing, incoming)).toEqual([
        ...existing,
        ...incoming,
      ]);
    });

    test("de-dupes entries sharing the same domain+identity", () => {
      const shared: CleanupEntry = {
        domain: "commerceWebhook",
        identity: "webhook-1",
      };

      const result = mergeCleanupEntries([shared], [{ ...shared }]);

      expect(result).toEqual([shared]);
    });

    test("returns the incoming list unchanged when there is nothing existing", () => {
      const incoming: CleanupEntry[] = [
        { domain: "adminUi", identity: "adminUi" },
      ];

      expect(mergeCleanupEntries([], incoming)).toEqual(incoming);
    });

    test("returns the existing list unchanged when there is nothing incoming", () => {
      const existing: CleanupEntry[] = [
        { domain: "ioEventsProvider", identity: "provider-1" },
      ];

      expect(mergeCleanupEntries(existing, [])).toEqual(existing);
    });
  });
});
