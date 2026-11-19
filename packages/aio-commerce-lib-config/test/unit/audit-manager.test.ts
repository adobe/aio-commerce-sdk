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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  byCode,
  byCodeAndLevel,
  byScopeId,
  byStoreId,
  byStoreViewId,
  byWebsiteId,
  generateEncryptionKey,
  getAuditLog,
  getConfiguration,
  initialize,
  setConfiguration,
  setSystemConfigByKey,
} from "#index";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";
import { auditPath, auditPrefix } from "#utils/audit-storage";
import { DEFAULT_NAMESPACE } from "#utils/constants";

const MockFiles = createMockLibFiles();
const MockState = createMockLibState();
let files = new MockFiles();
let state = new MockState();
const encryptionKey = generateEncryptionKey();

vi.mock("#utils/repository", () => ({
  getAllSharedStates: vi.fn(async () => [state]),
  getSharedFiles: vi.fn(async () => files),
  getSharedState: vi.fn(async () => state),
}));
vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  getPersistedScopeTree: vi.fn(async () => mockScopeTree),
}));

const write = (value: string, userId?: string) =>
  setConfiguration(
    {
      config: [{ name: "setting", value }],
      metadata: { actor: { source: "support-tool", userId } },
    },
    byScopeId("id-global"),
  );

describe("business configuration audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    files = new MockFiles();
    state = new MockState();
    initialize({
      schema: [
        { default: "default", name: "setting", type: "text" },
        { default: "", name: "pin", type: "password" },
        { default: "", name: "api_key", type: "password" },
        { default: false, name: "enabled", type: "boolean" },
        {
          default: [],
          name: "choices",
          options: [{ label: "One", value: "one" }],
          selectionMode: "multiple",
          type: "list",
        },
      ],
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["scope ID", byScopeId("id-global")],
    ["code and level", byCodeAndLevel("base", "website")],
    ["code", byCode("base_region")],
    ["website ID", byWebsiteId(1)],
    ["store ID", byStoreId(1)],
    ["store-view ID", byStoreViewId(1)],
  ])("queries using the existing %s selector", async (_name, selector) => {
    await write("other");
    await setConfiguration(
      {
        config: [{ name: "setting", value: "selected" }],
        metadata: { actor: { userId: "selected-operator" } },
      },
      selector,
    );
    const audit = await getAuditLog(selector, { userId: "selected-operator" });
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries.at(0)?.changes.at(0)?.new?.value).toBe("selected");
    expect(
      (await getAuditLog(byScopeId("id-global"), { userId: "missing" }))
        .entries,
    ).toEqual([]);
  });

  it("rejects unknown scopes instead of returning an unscoped audit", async () => {
    await write("value");
    await expect(getAuditLog(byScopeId("missing"))).rejects.toThrow(
      "INVALID_SCOPE",
    );
    expect(files.list).not.toHaveBeenCalled();
  });

  it("records who changed each field with typed before/after values and origins", async () => {
    const response = await write("first", "operator-1");
    expect(response).not.toHaveProperty("versionInfo");
    await write("second", "operator-2");
    const audit = await getAuditLog(byScopeId("id-global"));
    expect(audit.entries).toHaveLength(2);
    expect(audit.entries.at(0)).toMatchObject({
      actor: { source: "support-tool", userId: "operator-2" },
      changes: [
        {
          name: "setting",
          new: { origin: { code: "global", level: "global" }, value: "second" },
          old: { origin: { code: "global", level: "global" }, value: "first" },
          type: "modified",
        },
      ],
      scope: { code: "global", id: "id-global", level: "global" },
    });
    expect(audit.entries.at(1)?.changes).toEqual([
      {
        name: "setting",
        new: { origin: { code: "global", level: "global" }, value: "first" },
        type: "added",
      },
    ]);
    expect(audit.entries.at(0)).not.toHaveProperty("snapshot");
    expect(audit.entries.at(0)).not.toHaveProperty("versionId");
    expect(audit.entries.at(0)).not.toHaveProperty("integrityHash");
  });

  it("records additions, updates and unsets across all scope levels", async () => {
    await setConfiguration(
      {
        config: [
          { name: "enabled", value: true },
          { name: "choices", value: ["one"] },
        ],
      },
      byWebsiteId(1),
    );
    await setConfiguration(
      {
        config: [
          { name: "enabled", value: false },
          { name: "choices", value: null },
        ],
      },
      byWebsiteId(1),
    );
    await setConfiguration(
      { config: [{ name: "setting", value: "store" }] },
      byStoreViewId(1),
    );
    const { entries } = await getAuditLog(byWebsiteId(1));
    expect(entries.at(0)?.changes).toEqual([
      expect.objectContaining({
        name: "enabled",
        new: { origin: { code: "base", level: "website" }, value: false },
        old: { origin: { code: "base", level: "website" }, value: true },
        type: "modified",
      }),
      expect.objectContaining({
        name: "choices",
        old: { origin: { code: "base", level: "website" }, value: ["one"] },
        type: "removed",
      }),
    ]);
    expect(entries.at(0)?.changes.at(1)).not.toHaveProperty("new");
    expect(
      (await getAuditLog(byStoreViewId(1))).entries.at(0)?.scope.level,
    ).toBe("store_view");
    expect((await getAuditLog()).pagination.total).toBe(3);
  });

  it("never persists sensitive old/new values, encrypted credentials or unknown-field values in audit", async () => {
    const writeSecrets = (suffix: string) =>
      setConfiguration(
        {
          config: [
            { name: "pin", value: `password-${suffix}` },
            { name: "api_key", value: `key-${suffix}` },
            { name: "refreshToken", value: `token-${suffix}` },
            { name: "unregistered", value: `unknown-${suffix}` },
          ],
        },
        byScopeId("id-global"),
        { encryptionKey },
      );
    const first = await writeSecrets("first");
    const second = await writeSecrets("second");
    await setConfiguration(
      {
        config: [
          { name: "pin", value: null },
          { name: "api_key", value: null },
        ],
      },
      byScopeId("id-global"),
      { encryptionKey },
    );
    const { entries } = await getAuditLog();
    for (const entry of entries) {
      for (const change of entry.changes) {
        expect(
          change.old?.value === undefined ||
            change.old.value === "***REDACTED***",
        ).toBe(true);
        expect(
          change.new?.value === undefined ||
            change.new.value === "***REDACTED***",
        ).toBe(true);
      }
    }
    const auditWrites = files.write.mock.calls.filter(([path]) =>
      path.startsWith("audit/"),
    );
    expect(auditWrites).toHaveLength(3);
    const serialized = JSON.stringify(auditWrites);
    for (const value of [
      "password-first",
      "password-second",
      "key-first",
      "key-second",
      "token-first",
      "token-second",
      "unknown-first",
      "unknown-second",
    ]) {
      expect(serialized).not.toContain(value);
    }
    for (const response of [first, second]) {
      const encrypted = response.config.find(
        (entry) => entry.name === "pin",
      )?.value;
      expect(typeof encrypted).toBe("string");
      if (typeof encrypted === "string") {
        expect(serialized).not.toContain(encrypted);
      }
    }
    const current = await getConfiguration(byScopeId("id-global"), {
      encryptionKey,
    });
    expect(
      current.config.find((entry) => entry.name === "refreshToken")?.value,
    ).toBe("token-second");
  });

  it.each(["api_key", "secret", "token", "password"])(
    "does not infer sensitivity from the declared text field name %s",
    async (name) => {
      initialize({ schema: [{ default: "", name, type: "text" }] });
      await setConfiguration(
        { config: [{ name, value: "public-before" }] },
        byScopeId("id-global"),
      );
      await setConfiguration(
        { config: [{ name, value: "public-after" }] },
        byScopeId("id-global"),
      );
      const { entries } = await getAuditLog();
      expect(entries.at(0)?.changes).toMatchObject([
        {
          name,
          new: { value: "public-after" },
          old: { value: "public-before" },
        },
      ]);
    },
  );

  it("only keeps userId and source and does not invent an identity when absent", async () => {
    const actor = {
      ipAddress: "private-ip",
      source: "support",
      token: "private-token",
      userAgent: "private-agent",
      userId: "operator",
    };
    await setConfiguration(
      {
        config: [{ name: "setting", value: "attributed" }],
        metadata: { actor },
      },
      byScopeId("id-global"),
    );
    await setConfiguration(
      { config: [{ name: "setting", value: "anonymous" }] },
      byScopeId("id-global"),
    );
    const { entries } = await getAuditLog();
    expect(entries.at(0)?.actor).toEqual({});
    expect(entries.at(1)?.actor).toEqual({
      source: "support",
      userId: "operator",
    });

    expect(
      JSON.stringify(
        files.write.mock.calls.filter(([path]) => path.startsWith("audit/")),
      ),
    ).not.toContain("private-");
  });

  it("redacts previous encrypted values even if the current schema reclassifies the field", async () => {
    await setConfiguration(
      { config: [{ name: "pin", value: "private-value" }] },
      byScopeId("id-global"),
      { encryptionKey },
    );
    initialize({ schema: [{ default: "", name: "pin", type: "text" }] });
    await setConfiguration(
      { config: [{ name: "pin", value: "new-text" }] },
      byScopeId("id-global"),
    );
    const { entries } = await getAuditLog();
    expect(entries.at(0)?.changes).toMatchObject([
      {
        name: "pin",
        new: { value: "***REDACTED***" },
        old: { value: "***REDACTED***" },
      },
    ]);
    const persisted = JSON.stringify(
      files.write.mock.calls.filter(([path]) => path.startsWith("audit/")),
    );
    expect(persisted).not.toContain("private-value");
    expect(persisted).not.toContain("enc:");
  });

  it("does not record unchanged values, empty writes or unrelated system settings", async () => {
    await write("same");
    await write("same");
    await setConfiguration({ config: [] }, byScopeId("id-global"));
    await setSystemConfigByKey("system-setting", { enabled: true });
    expect((await getAuditLog()).entries).toHaveLength(1);
  });

  it("queries by actor and dates, paginates newest first and never changes configuration", async () => {
    await write("one", "first");
    await write("two", "second");
    const audit = await getAuditLog(undefined, { userId: "second" });
    const timestamp = audit.entries.at(0)?.timestamp;
    expect(timestamp).toBeDefined();
    expect(
      (
        await getAuditLog(undefined, {
          endDate: timestamp,
          startDate: timestamp,
          userId: "second",
        })
      ).entries,
    ).toEqual(audit.entries);
    expect(
      (await getAuditLog(undefined, { userId: "absent" })).entries,
    ).toEqual([]);
    files.write.mockClear();
    files.delete.mockClear();
    const page = await getAuditLog(undefined, { limit: 1 });
    expect(page.entries.at(0)?.actor.userId).toBe("second");
    expect(page.pagination).toEqual({
      hasMore: true,
      limit: 1,
      offset: 0,
      total: 2,
    });
    expect(
      (await getAuditLog(undefined, { limit: 1, offset: 1 })).entries.at(0)
        ?.actor.userId,
    ).toBe("first");
    expect(
      (await getConfiguration(byScopeId("id-global"))).config.find(
        (entry) => entry.name === "setting",
      )?.value,
    ).toBe("two");
    expect(files.write).not.toHaveBeenCalled();
    expect(files.delete).not.toHaveBeenCalled();
    state = new MockState();
    expect((await getAuditLog()).entries).toHaveLength(2);
  });

  it("rejects invalid pagination and date filters", async () => {
    await expect(getAuditLog(undefined, { limit: 0 })).rejects.toThrow(
      "INVALID_PAGINATION",
    );
    await expect(getAuditLog(undefined, { limit: 1001 })).rejects.toThrow(
      "INVALID_PAGINATION",
    );
    await expect(getAuditLog(undefined, { offset: -1 })).rejects.toThrow(
      "INVALID_PAGINATION",
    );
    await expect(
      getAuditLog(undefined, { startDate: "invalid" }),
    ).rejects.toThrow("INVALID_AUDIT_DATES");
    await expect(
      getAuditLog(undefined, {
        endDate: "2026-01-01",
        startDate: "2026-02-01",
      }),
    ).rejects.toThrow("INVALID_AUDIT_DATES");
    expect(files.list).not.toHaveBeenCalled();
  });

  it.each([
    { limit: 1.5 },
    { limit: Number.NaN },
    { limit: Number.POSITIVE_INFINITY },
    { offset: 0.5 },
    { offset: Number.MAX_SAFE_INTEGER + 1 },
  ])(
    "rejects unsafe pagination before reading storage: %o",
    async (filters) => {
      await expect(getAuditLog(undefined, filters)).rejects.toThrow(
        "INVALID_PAGINATION",
      );
      expect(files.list).not.toHaveBeenCalled();
    },
  );

  it("accepts pagination boundaries and compares date filters as instants", async () => {
    await write("value");
    const audit = await getAuditLog();
    const timestamp = audit.entries.at(0)?.timestamp;
    if (!timestamp) {
      throw new Error("Expected an audit timestamp");
    }
    expect(
      (
        await getAuditLog(undefined, {
          endDate: timestamp,
          limit: 1000,
          startDate: timestamp.replace("Z", "+00:00"),
        })
      ).entries,
    ).toEqual(audit.entries);
    expect(
      (
        await getAuditLog(undefined, {
          offset: Number.MAX_SAFE_INTEGER,
        })
      ).entries,
    ).toEqual([]);
  });

  it("rejects malformed filter types at runtime", async () => {
    await expect(
      // @ts-expect-error Runtime callers can provide invalid filter values.
      getAuditLog(undefined, { limit: "50" }),
    ).rejects.toThrow("INVALID_PAGINATION");
    await expect(
      // @ts-expect-error Runtime callers can provide invalid filter values.
      getAuditLog(undefined, { startDate: 0 }),
    ).rejects.toThrow("INVALID_AUDIT_DATES");
    await expect(
      // @ts-expect-error Runtime callers can provide invalid filter values.
      getAuditLog(undefined, { userId: 123 }),
    ).rejects.toThrow();
    expect(files.list).not.toHaveBeenCalled();
  });

  it("does not write audit when primary persistence fails", async () => {
    files.write.mockRejectedValueOnce(new Error("primary write failed"));
    await expect(write("blocked")).rejects.toThrow("primary write failed");
    expect((await getAuditLog()).entries).toEqual([]);
  });

  it("reports audit storage failure explicitly after live configuration was saved", async () => {
    const originalWrite = files.write.getMockImplementation();
    if (!originalWrite) {
      throw new Error("Expected an in-memory Files implementation");
    }
    files.write.mockImplementation(async (path, content) => {
      if (path.startsWith(auditPrefix(DEFAULT_NAMESPACE))) {
        throw new Error("audit unavailable");
      }
      return await originalWrite(path, content);
    });
    await expect(write("saved")).rejects.toThrow(
      "CONFIGURATION_SAVED_WITHOUT_AUDIT",
    );
    expect(
      (await getConfiguration(byScopeId("id-global"))).config.find(
        (entry) => entry.name === "setting",
      )?.value,
    ).toBe("saved");
    expect((await getAuditLog()).entries).toEqual([]);
  });

  it("fails explicitly for missing, corrupt, inaccessible or mismatched audit records", async () => {
    await write("first");
    const { entries } = await getAuditLog();
    const entry = entries.at(0);
    if (!entry) {
      throw new Error("Expected an audit entry");
    }
    const path = auditPath(DEFAULT_NAMESPACE, entry.id);
    await files.write(path, "{");
    await expect(getAuditLog()).rejects.toThrow("CORRUPT_AUDIT");
    await files.write(path, "{}");
    await expect(getAuditLog()).rejects.toThrow("CORRUPT_AUDIT");
    await files.write(path, JSON.stringify({ ...entry, id: "different" }));
    await expect(getAuditLog()).rejects.toThrow("identity mismatch");
    files.read.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(getAuditLog()).rejects.toThrow("storage unavailable");
    files.list.mockResolvedValueOnce([
      { name: auditPath(DEFAULT_NAMESPACE, "missing") },
    ]);
    await expect(getAuditLog()).rejects.toThrow("ENOENT");
  });

  it("rejects an oversized audit before persisting live values", async () => {
    await expect(write("x".repeat(10 * 1024 * 1024))).rejects.toThrow(
      "AUDIT_SIZE_LIMIT",
    );
    expect(files.write).not.toHaveBeenCalled();
  });
});
