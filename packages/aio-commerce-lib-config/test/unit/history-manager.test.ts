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

import * as v from "valibot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveOldVersions,
  archiveVersion,
  byCodeAndLevel,
  byScopeId,
  byStoreViewId,
  byWebsiteId,
  compareVersions,
  generateEncryptionKey,
  getAuditLog,
  getConfiguration,
  getConfigurationHistory,
  getStorageStats,
  getVersionById,
  getVersionComparison,
  initialize,
  restoreFromArchive,
  rollbackConfiguration,
  setConfiguration,
  setSystemConfigByKey,
  shouldArchive,
  verifyAuditChain,
} from "#index";
import { prepareAuditEntry } from "#modules/audit/audit-logger";
import { saveAuditEntry } from "#modules/audit/audit-repository";
import { getVersionRecord } from "#modules/versioning/version-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";
import { DEFAULT_NAMESPACE } from "#utils/constants";
import {
  ARCHIVE_SIZE_THRESHOLD,
  AuditEntrySchema,
  historyPath,
  historyPrefix,
  MAX_HISTORY_SIZE,
} from "#utils/history-storage";

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

const write = (value: string) =>
  setConfiguration(
    { config: [{ name: "setting", value }] },
    byScopeId("id-global"),
  );
async function latest(scope = "global") {
  const { versions } = await getConfigurationHistory(scope);
  const version = versions.at(0);
  if (!version) {
    throw new Error("Expected a recorded version");
  }
  return version;
}

describe("durable configuration history and audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    files = new MockFiles();
    state = new MockState();
    initialize({
      schema: [
        { default: "default", name: "setting", type: "text" },
        { default: "", name: "pin", type: "password" },
        { default: false, name: "enabled", type: "boolean" },
        {
          default: [],
          name: "choices",
          options: [
            { label: "One", value: "one" },
            { label: "Two", value: "two" },
          ],
          selectionMode: "multiple",
          type: "list",
        },
      ],
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("records typed overrides, actor metadata, ordered versions and audit entries", async () => {
    const response = await setConfiguration(
      {
        config: [
          { name: "enabled", value: true },
          { name: "choices", value: ["one", "two"] },
        ],
        metadata: { actor: { source: "support-tool", userId: "operator" } },
      },
      byWebsiteId(1),
    );
    expect(response.versionInfo).toMatchObject({ versionNumber: 1 });
    const first = await latest("base");
    expect(first.scope).toEqual({ code: "base", id: "idw", level: "website" });
    expect(first.snapshot).toMatchObject([
      { value: true },
      { value: ["one", "two"] },
    ]);
    await setConfiguration(
      { config: [{ name: "enabled", value: false }] },
      byCodeAndLevel("base", "website"),
    );
    const history = await getConfigurationHistory("BASE", { limit: 1 });
    expect(history.versions.at(0)).toMatchObject({
      previousVersionId: first.id,
      versionNumber: 2,
    });
    expect(history.pagination).toEqual({
      hasMore: true,
      limit: 1,
      offset: 0,
      total: 2,
    });
    const audit = await getAuditLog({ scopeCode: "base", userId: "operator" });
    expect(audit.entries.at(0)).toMatchObject({
      action: "create",
      actor: { source: "support-tool", userId: "operator" },
      versionId: first.id,
    });
    expect(await verifyAuditChain("base")).toMatchObject({
      entriesChecked: 2,
      valid: true,
    });
  });

  it("queries all scopes and filters actions, actors, normalized dates and pagination", async () => {
    await write("one");
    await setConfiguration(
      { config: [{ name: "setting", value: "store" }] },
      byStoreViewId(1),
    );
    await write("two");
    expect((await getAuditLog()).pagination.total).toBe(3);
    const filtered = await getAuditLog({
      action: "update",
      endDate: "2099-12-31T23:59:59Z",
      limit: 1,
      startDate: "2026-01-01T01:00:00+01:00",
    });
    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries.at(0)?.scope.code).toBe("global");
    expect(
      (await getAuditLog({ limit: 1, offset: 1 })).pagination,
    ).toMatchObject({ hasMore: true, total: 3 });
    expect((await getAuditLog({ userId: "absent" })).entries).toEqual([]);
  });

  it("redacts schema passwords and sensitive names in snapshots, diffs, audit and archives", async () => {
    await setConfiguration(
      {
        config: [
          { name: "pin", value: "first-sensitive-value" },
          { name: "api_key", value: "second-sensitive-value" },
        ],
      },
      byScopeId("id-global"),
      { encryptionKey },
    );
    const version = await latest();
    expect(
      version.snapshot.every((entry) => entry.value === "***REDACTED***"),
    ).toBe(true);
    const persistedHistory = files.write.mock.calls.filter(([path]) =>
      path.startsWith("history/"),
    );
    expect(JSON.stringify(persistedHistory)).not.toContain(
      "first-sensitive-value",
    );
    expect(JSON.stringify(persistedHistory)).not.toContain(
      "second-sensitive-value",
    );
    expect((await getAuditLog()).entries.at(0)?.changes.at(0)?.newValue).toBe(
      "***REDACTED***",
    );
    await archiveVersion({
      namespace: DEFAULT_NAMESPACE,
      scopeCode: "global",
      version,
    });
    expect(
      (await restoreFromArchive(DEFAULT_NAMESPACE, "global", version.id))
        ?.snapshot,
    ).toEqual(version.snapshot);
  });

  it("rolls back global overrides, removes later fields and preserves the current encrypted secret", async () => {
    await setConfiguration(
      {
        config: [
          { name: "setting", value: "first" },
          { name: "pin", value: "old-sensitive" },
        ],
      },
      byScopeId("id-global"),
      { encryptionKey },
    );
    const first = await latest();
    await setConfiguration(
      {
        config: [
          { name: "setting", value: "second" },
          { name: "pin", value: "current-sensitive" },
          { name: "enabled", value: true },
        ],
      },
      byScopeId("id-global"),
      { encryptionKey },
    );
    const response = await rollbackConfiguration(
      "global",
      first.id,
      { actor: { userId: "operator" } },
      { encryptionKey },
    );
    expect(response.versionInfo?.versionNumber).toBe(3);
    const current = await getConfiguration(byScopeId("id-global"), {
      encryptionKey,
    });
    expect(
      current.config.find((entry) => entry.name === "setting")?.value,
    ).toBe("first");
    expect(current.config.find((entry) => entry.name === "pin")?.value).toBe(
      "current-sensitive",
    );
    const restored = await latest();
    expect(
      restored.snapshot.find((entry) => entry.name === "enabled"),
    ).toBeUndefined();
    expect(
      (await getAuditLog({ action: "rollback" })).entries.at(0)?.actor.userId,
    ).toBe("operator");
  });

  it("rolls back website and store-view scopes without using the default scope level", async () => {
    await setConfiguration(
      { config: [{ name: "setting", value: "website-old" }] },
      byWebsiteId(1),
    );
    const website = await latest("base");
    await setConfiguration(
      { config: [{ name: "setting", value: "website-new" }] },
      byWebsiteId(1),
    );
    await rollbackConfiguration("base", website.id);
    expect(
      (await getConfiguration(byWebsiteId(1))).config.find(
        (entry) => entry.name === "setting",
      )?.value,
    ).toBe("website-old");
    await setConfiguration(
      { config: [{ name: "setting", value: "store-old" }] },
      byStoreViewId(1),
    );
    const store = await latest("default");
    await setConfiguration(
      { config: [{ name: "setting", value: "store-new" }] },
      byStoreViewId(1),
    );
    await rollbackConfiguration("default", store.id);
    expect(
      (await getConfiguration(byStoreViewId(1))).config.find(
        (entry) => entry.name === "setting",
      )?.value,
    ).toBe("store-old");
  });

  it("restores inheritance when the target has no local override", async () => {
    await write("inherited");
    await setConfiguration(
      { config: [{ name: "enabled", value: true }] },
      byWebsiteId(1),
    );
    const target = await latest("base");
    await setConfiguration(
      { config: [{ name: "setting", value: "override" }] },
      byWebsiteId(1),
    );
    await rollbackConfiguration("base", target.id);
    const current = await getConfiguration(byWebsiteId(1));
    expect(
      current.config.find((entry) => entry.name === "setting"),
    ).toMatchObject({
      origin: { code: "global", level: "global" },
      value: "inherited",
    });
  });

  it("compares retained versions and reconstructs removed fields from a retained diff", async () => {
    await write("first");
    const first = await latest();
    await setConfiguration(
      { config: [{ name: "setting", value: null }] },
      byScopeId("id-global"),
    );
    const second = await latest();
    expect((await getVersionComparison("global", second.id))?.before).toEqual(
      first.snapshot,
    );
    expect(
      (await compareVersions("global", first.id, second.id))?.changes,
    ).toMatchObject([{ name: "setting", oldValue: "first", type: "removed" }]);
    expect(await getVersionById("base", first.id)).toBeNull();
    await expect(rollbackConfiguration("global", "missing")).rejects.toThrow(
      "VERSION_NOT_FOUND",
    );
  });

  it("keeps increasing version numbers after retention and deletes archived payloads", async () => {
    vi.stubEnv("MAX_CONFIG_VERSIONS", "2");
    await write("first");
    const first = await latest();
    await archiveVersion({
      namespace: DEFAULT_NAMESPACE,
      scopeCode: "global",
      version: first,
    });
    const archivePath = historyPath(
      DEFAULT_NAMESPACE,
      "archives",
      "global",
      first.id,
    );
    await write("second");
    await write("third");
    await write("fourth");
    const history = await getConfigurationHistory("global");
    expect(history.versions.map((version) => version.versionNumber)).toEqual([
      4, 3,
    ]);
    expect(await getVersionById("global", first.id)).toBeNull();
    await expect(files.read(archivePath)).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect((await getAuditLog()).pagination.total).toBe(4);
    expect(await verifyAuditChain("global")).toMatchObject({
      entriesChecked: 4,
      valid: true,
    });
  });

  it("automatically archives large snapshots and can compare and roll them back", async () => {
    await write("x".repeat(ARCHIVE_SIZE_THRESHOLD));
    const first = await latest();
    expect(
      await getVersionRecord(DEFAULT_NAMESPACE, "global", first.id),
    ).toMatchObject({ archived: true, reason: "size" });
    await write("small");
    expect((await getVersionById("global", first.id))?.snapshot).toEqual(
      first.snapshot,
    );
    await rollbackConfiguration("global", first.id);
    expect((await latest()).snapshot).toEqual(first.snapshot);
  });

  it("archives old records once, isolates namespaces, and counts only existing distinct records", async () => {
    await write("value");
    const version = await latest();
    const old = { ...version, timestamp: "2020-01-01T00:00:00.000Z" };
    await archiveVersion({
      namespace: "other",
      scopeCode: "global",
      version: old,
    });
    expect(shouldArchive(old)).toEqual({ reason: "age", should: true });
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(version.timestamp) + 1);
    expect(
      await archiveOldVersions(
        DEFAULT_NAMESPACE,
        "global",
        [version.id, version.id],
        0,
      ),
    ).toBe(1);
    expect(
      await archiveOldVersions(DEFAULT_NAMESPACE, "global", [version.id], 0),
    ).toBe(0);
    expect(
      await getStorageStats(DEFAULT_NAMESPACE, "global", [
        version.id,
        version.id,
        "missing",
      ]),
    ).toMatchObject({ activeCount: 0, archivedCount: 1, totalVersions: 1 });
    expect((await getVersionById("global", version.id))?.timestamp).toBe(
      version.timestamp,
    );
    expect(
      (await restoreFromArchive("other", "global", version.id))?.timestamp,
    ).toBe(old.timestamp);
  });

  it("detects tampering and missing middle records, and stops new writes to a broken chain", async () => {
    await write("one");
    await write("two");
    await write("three");
    const { entries } = await getAuditLog({ scopeCode: "global" });
    const middle = entries.at(1);
    if (!middle) {
      throw new Error("Expected a middle audit entry");
    }
    const path = historyPath(DEFAULT_NAMESPACE, "audit", "global", middle.id);
    const original = await files.read(path);
    const entry = v.parse(AuditEntrySchema, JSON.parse(original.toString()));
    await files.write(
      path,
      JSON.stringify({ ...entry, actor: { userId: "changed" } }),
    );
    expect(await verifyAuditChain("global")).toMatchObject({
      brokenAt: middle.id,
      valid: false,
    });
    await expect(write("blocked")).rejects.toThrow("INVALID_AUDIT_CHAIN");
    await files.delete(path);
    expect(await verifyAuditChain("global")).toMatchObject({ valid: false });
  });

  it("uses a trusted head to detect trailing deletion, including deletion of the entire chain", async () => {
    await write("one");
    await write("two");
    const verified = await verifyAuditChain("global");
    const { entries } = await getAuditLog();
    const entry = entries.at(0);
    const first = entries.at(1);
    if (!(verified.headHash && entry && first)) {
      throw new Error("Expected a non-empty audit chain");
    }
    await files.delete(
      historyPath(DEFAULT_NAMESPACE, "audit", "global", entry.id),
    );
    expect(await verifyAuditChain("global")).toMatchObject({
      entriesChecked: 1,
      valid: true,
    });
    expect(await verifyAuditChain("global", verified.headHash)).toMatchObject({
      valid: false,
    });
    await files.delete(
      historyPath(DEFAULT_NAMESPACE, "audit", "global", first.id),
    );
    expect(await verifyAuditChain("global")).toMatchObject({
      headHash: null,
      valid: true,
    });
    expect(await verifyAuditChain("global", verified.headHash)).toMatchObject({
      valid: false,
    });
  });

  it("detects concurrent-write forks without losing either immutable audit record", async () => {
    await write("initial");
    const request = {
      action: "update" as const,
      actor: {},
      changes: [],
      scope: { code: "global", id: "id-global", level: "global" },
      versionId: "concurrent",
    };
    const context = { namespace: DEFAULT_NAMESPACE };
    const [first, second] = await Promise.all([
      prepareAuditEntry(context, request),
      prepareAuditEntry(context, request),
    ]);
    await Promise.all([
      saveAuditEntry(DEFAULT_NAMESPACE, first),
      saveAuditEntry(DEFAULT_NAMESPACE, second),
    ]);
    expect((await getAuditLog()).pagination.total).toBe(3);
    expect(await verifyAuditChain("global")).toMatchObject({ valid: false });
  });

  it("rejects malformed, oversized, inaccessible, or unexpectedly missing history records", async () => {
    await write("first");
    const version = await latest();
    const path = historyPath(
      DEFAULT_NAMESPACE,
      "versions",
      "global",
      version.id,
    );
    await files.write(path, "{");
    await expect(getVersionById("global", version.id)).rejects.toThrow(
      "CORRUPT_HISTORY",
    );
    await files.write(path, "{}");
    await expect(getVersionById("global", version.id)).rejects.toThrow(
      "CORRUPT_HISTORY",
    );
    await files.write(path, " ".repeat(MAX_HISTORY_SIZE + 1));
    await expect(getVersionById("global", version.id)).rejects.toThrow("limit");
    files.read.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(getVersionById("global", version.id)).rejects.toThrow(
      "storage unavailable",
    );
    files.list.mockResolvedValueOnce([
      { name: historyPath(DEFAULT_NAMESPACE, "audit", "global", "missing") },
    ]);
    await expect(getAuditLog({ scopeCode: "global" })).rejects.toThrow(
      "CORRUPT_HISTORY",
    );
  });

  it("rejects forged archive paths and missing archived payloads instead of reading arbitrary files", async () => {
    await write("first");
    const version = await latest();
    const reference = await archiveVersion({
      namespace: DEFAULT_NAMESPACE,
      scopeCode: "global",
      version,
    });
    const path = historyPath(
      DEFAULT_NAMESPACE,
      "versions",
      "global",
      version.id,
    );
    await files.write(
      path,
      JSON.stringify({
        ...reference,
        archivePath: "scope/global/configuration.json",
      }),
    );
    await expect(getVersionById("global", version.id)).rejects.toThrow(
      "archive path mismatch",
    );
    await files.write(path, JSON.stringify(reference));
    await files.delete(reference.archivePath);
    await expect(getVersionById("global", version.id)).rejects.toThrow(
      "archived version is missing",
    );
  });

  it("rejects unsafe pagination and date ranges", async () => {
    await expect(
      getConfigurationHistory("global", { limit: 0 }),
    ).rejects.toThrow("INVALID_PAGINATION");
    await expect(getAuditLog({ offset: -1 })).rejects.toThrow(
      "INVALID_PAGINATION",
    );
    await expect(getAuditLog({ limit: 1001 })).rejects.toThrow(
      "INVALID_PAGINATION",
    );
    await expect(getAuditLog({ startDate: "invalid" })).rejects.toThrow(
      "INVALID_AUDIT_DATES",
    );
    await expect(
      getAuditLog({ endDate: "2026-01-01", startDate: "2026-02-01" }),
    ).rejects.toThrow("INVALID_AUDIT_DATES");
  });

  it("rejects invalid retention and oversized versions before changing configuration", async () => {
    vi.stubEnv("MAX_CONFIG_VERSIONS", "2suffix");
    await expect(write("first")).rejects.toThrow("INVALID_RETENTION");
    expect(files.write).not.toHaveBeenCalled();
    vi.stubEnv("MAX_CONFIG_VERSIONS", "25");
    await expect(write("x".repeat(6 * 1024 * 1024))).rejects.toThrow("limit");
    expect(files.write).not.toHaveBeenCalled();
  });

  it("does not create history when primary persistence fails", async () => {
    const originalWrite = files.write.getMockImplementation();
    if (!originalWrite) {
      throw new Error("Expected an in-memory Files implementation");
    }
    files.write.mockImplementation(async (path, content) => {
      if (path === "scope/global/configuration.json") {
        throw new Error("primary write failed");
      }
      return await originalWrite(path, content);
    });
    await expect(write("first")).rejects.toThrow("primary write failed");
    expect((await getConfigurationHistory("global")).versions).toEqual([]);
    expect((await getAuditLog()).entries).toEqual([]);
  });

  it("reports history failure explicitly after the live configuration has been saved", async () => {
    const originalWrite = files.write.getMockImplementation();
    if (!originalWrite) {
      throw new Error("Expected an in-memory Files implementation");
    }
    files.write.mockImplementation(async (path, content) => {
      if (path.startsWith(historyPrefix(DEFAULT_NAMESPACE, "audit"))) {
        throw new Error("audit write failed");
      }
      return await originalWrite(path, content);
    });
    await expect(write("saved")).rejects.toThrow(
      "CONFIGURATION_SAVED_WITHOUT_COMPLETE_HISTORY",
    );
    expect(
      (await getConfiguration(byScopeId("id-global"))).config.find(
        (entry) => entry.name === "setting",
      )?.value,
    ).toBe("saved");
  });

  it("does not audit unrelated system configuration writes", async () => {
    await setSystemConfigByKey("system-setting", { enabled: true });
    expect((await getAuditLog()).entries).toEqual([]);
    expect((await getConfigurationHistory("global")).versions).toEqual([]);
  });

  it("keeps history and audit available after the State cache is lost", async () => {
    await write("durable");
    const first = await latest();
    state = new MockState();
    expect(await getVersionById("global", first.id)).toEqual(first);
    expect((await getAuditLog()).entries).toHaveLength(1);
    expect(await verifyAuditChain("global")).toMatchObject({ valid: true });
  });

  it("allows inspection even when a writing action has an invalid retention setting", async () => {
    await write("inspectable");
    const first = await latest();
    vi.stubEnv("MAX_CONFIG_VERSIONS", "invalid");
    expect((await getConfigurationHistory("global")).versions).toHaveLength(1);
    expect((await getVersionComparison("global", first.id))?.version.id).toBe(
      first.id,
    );
    await expect(write("blocked")).rejects.toThrow("INVALID_RETENTION");
  });
});
