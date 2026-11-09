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

import {
  getConfiguration,
  initialize,
  setConfiguration,
} from "#config-manager";
import { byCode, byCodeAndLevel, byScopeId, byWebsiteId } from "#config-utils";
import {
  getConfigurationVersions,
  restoreConfigurationVersion,
} from "#modules/versioning/index";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

import type { BusinessConfigSchema } from "#index";
import type { ScopeTree } from "#modules/scope-tree/types";

const MockFiles = createMockLibFiles();
const MockState = createMockLibState();
let files = new MockFiles();
let state = new MockState();
let tree: ScopeTree = structuredClone(mockScopeTree);

vi.mock("#utils/repository", () => ({
  getAllSharedStates: vi.fn(async () => [state]),
  getSharedFiles: vi.fn(async () => files),
  getSharedState: vi.fn(async () => state),
}));
vi.mock("#modules/scope-tree/scope-tree-repository", () => ({
  getPersistedScopeTree: vi.fn(async () => tree),
}));

const schema = [
  { name: "currency", type: "text" },
  { name: "secret", type: "password" },
  { name: "enabled", type: "boolean" },
  {
    name: "tags",
    options: [{ label: "A", value: "a" }],
    selectionMode: "multiple",
    type: "list",
  },
] satisfies BusinessConfigSchema;
const selector = byScopeId("id-global");
const encryptionKey =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const options = { encryptionKey };
const path = "scope/global/configuration.json";
const missingId = "019a6129-0000-7000-8000-000000000001";

async function setCurrency(value: string) {
  await setConfiguration({ config: [{ name: "currency", value }] }, selector);
  const { versions } = await getConfigurationVersions(selector);
  return versions[0];
}

describe("configuration versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    files = new MockFiles();
    state = new MockState();
    tree = structuredClone(mockScopeTree);
    initialize({ schema });
  });

  test("records added, updated, and removed values with booleans and arrays intact", async () => {
    await setConfiguration(
      {
        config: [
          { name: "currency", value: "" },
          { name: "enabled", value: false },
          { name: "tags", value: ["a"] },
        ],
      },
      selector,
    );
    await setConfiguration(
      {
        config: [
          { name: "currency", value: null },
          { name: "enabled", value: true },
        ],
      },
      selector,
    );
    const history = await getConfigurationVersions(selector);
    expect(history.pagination.total).toBe(2);
    expect(history.versions[0]).toMatchObject({
      change: { added: [], removed: ["currency"], updated: ["enabled"] },
      changes: [
        { after: true, before: false, name: "enabled" },
        { before: "", name: "currency" },
      ],
      config: [
        { name: "enabled", value: true },
        { name: "tags", value: ["a"] },
      ],
    });
  });

  test("stores secrets encrypted and masks history and diffs after schema changes", async () => {
    await setConfiguration(
      { config: [{ name: "secret", value: "first-secret" }] },
      selector,
      options,
    );
    await setConfiguration(
      { config: [{ name: "secret", value: "second-secret" }] },
      selector,
      options,
    );
    const history = await getConfigurationVersions(selector);
    expect(JSON.stringify(history)).not.toContain("first-secret");
    expect(JSON.stringify(history)).not.toContain("second-secret");
    expect(history.versions[0]).toMatchObject({
      change: { updated: ["secret"] },
      changes: [{ after: "*****", before: "*****", name: "secret" }],
      config: [{ name: "secret", value: "*****" }],
    });
    const raw = await files.read(
      `versions/id-global/${history.versions[0].id}.json`,
    );
    expect(raw.toString()).not.toContain("second-secret");
    initialize({ schema: [{ name: "currency", type: "text" }] });
    const changedSchemaHistory = await getConfigurationVersions(selector);
    expect(changedSchemaHistory.versions[0].config).toEqual([
      { name: "secret", value: "*****" },
    ]);
  });

  test("does not mark an unchanged password as updated after re-encryption", async () => {
    await setConfiguration(
      { config: [{ name: "secret", value: "same-secret" }] },
      selector,
      options,
    );
    await setConfiguration(
      { config: [{ name: "secret", value: "same-secret" }] },
      selector,
      options,
    );
    const { versions } = await getConfigurationVersions(selector);
    expect(versions[0].change.updated).toEqual([]);
  });

  test("restores selected changed fields and leaves unrelated current overrides intact", async () => {
    const first = await setCurrency("EUR");
    await setConfiguration(
      {
        config: [
          { name: "currency", value: "USD" },
          { name: "enabled", value: true },
        ],
      },
      selector,
    );
    const result = await restoreConfigurationVersion(selector, {
      versionId: first.id,
    });
    expect(result.config).toEqual([{ name: "currency", value: "EUR" }]);
    const current = await getConfiguration(selector);
    expect(current.config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "currency", value: "EUR" }),
        expect.objectContaining({ name: "enabled", value: true }),
      ]),
    );
    const { versions } = await getConfigurationVersions(selector);
    expect(versions[0]).toMatchObject({
      reason: "restore",
      restoredFromVersionId: first.id,
    });
  });

  test("supports explicit field subsets and restores boolean and array values", async () => {
    await setConfiguration(
      {
        config: [
          { name: "enabled", value: false },
          { name: "tags", value: ["a"] },
        ],
      },
      selector,
    );
    const { versions } = await getConfigurationVersions(selector);
    await setConfiguration(
      {
        config: [
          { name: "enabled", value: true },
          { name: "tags", value: [] },
        ],
      },
      selector,
    );
    await restoreConfigurationVersion(selector, {
      fields: ["enabled", "tags"],
      versionId: versions[0].id,
    });
    const result = await getConfiguration(selector);
    expect(result.config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "enabled", value: false }),
        expect.objectContaining({ name: "tags", value: ["a"] }),
      ]),
    );
  });

  test("restores removals as unsets rather than empty strings", async () => {
    await setCurrency("EUR");
    await setConfiguration(
      { config: [{ name: "currency", value: null }] },
      selector,
    );
    const { versions } = await getConfigurationVersions(selector);
    await setCurrency("USD");
    const result = await restoreConfigurationVersion(selector, {
      versionId: versions[0].id,
    });
    expect(result.removed).toEqual(["currency"]);
    expect(JSON.parse((await files.read(path)).toString()).config).toEqual([]);
  });

  test("verifies and restores encrypted passwords without re-encrypting ciphertext", async () => {
    await setConfiguration(
      { config: [{ name: "secret", value: "first-secret" }] },
      selector,
      options,
    );
    const { versions } = await getConfigurationVersions(selector);
    await setConfiguration(
      { config: [{ name: "secret", value: "second-secret" }] },
      selector,
      options,
    );
    await expect(
      restoreConfigurationVersion(selector, { versionId: versions[0].id }),
    ).rejects.toThrow("Encryption key");
    const result = await restoreConfigurationVersion(
      selector,
      { versionId: versions[0].id },
      options,
    );
    expect(result.config).toEqual([{ name: "secret", value: "*****" }]);
    const current = await getConfiguration(selector, options);
    expect(current.config).toContainEqual(
      expect.objectContaining({ name: "secret", value: "first-secret" }),
    );
  });

  test("rejects a stale latest version before changing files or cached configuration", async () => {
    const first = await setCurrency("EUR");
    await setCurrency("USD");
    const before = (await files.read(path)).toString();
    files.write.mockClear();
    await expect(
      restoreConfigurationVersion(selector, {
        expectedLatestVersionId: first.id,
        versionId: first.id,
      }),
    ).rejects.toThrow("VERSION_CONFLICT");
    expect(files.write).not.toHaveBeenCalled();
    expect((await files.read(path)).toString()).toBe(before);
    expect((await getConfiguration(selector)).config).toContainEqual(
      expect.objectContaining({ name: "currency", value: "USD" }),
    );
  });

  test("accepts a matching latest version", async () => {
    const first = await setCurrency("EUR");
    const latest = await setCurrency("USD");
    await expect(
      restoreConfigurationVersion(selector, {
        expectedLatestVersionId: latest.id,
        versionId: first.id,
      }),
    ).resolves.toMatchObject({ restoredFromVersionId: first.id });
  });

  test.each([
    { limit: 0 },
    { limit: 201 },
    { limit: 1.5 },
    { limit: Number.POSITIVE_INFINITY },
    { offset: -1 },
    { offset: Number.NaN },
    { offset: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects invalid SDK paging %j", async (params) => {
    await expect(getConfigurationVersions(selector, params)).rejects.toThrow(
      "INVALID_PARAMS",
    );
  });

  test("paginates without needing the previous snapshot to reconstruct before values", async () => {
    await setCurrency("EUR");
    await setCurrency("USD");
    const history = await getConfigurationVersions(selector, {
      limit: 1,
      offset: 0,
    });
    expect(history.pagination).toEqual({ limit: 1, offset: 0, total: 2 });
    expect(history.versions[0].changes).toEqual([
      { after: "USD", before: "EUR", name: "currency" },
    ]);
    expect(
      (await getConfigurationVersions(selector, { offset: 99 })).versions,
    ).toEqual([]);
  });

  test("handles code and Commerce ID selectors without changing existing read selectors", async () => {
    await setCurrency("EUR");
    expect(
      (await getConfigurationVersions(byCode("global"))).pagination.total,
    ).toBe(1);
    await setConfiguration(
      { config: [{ name: "currency", value: "USD" }] },
      byWebsiteId(1),
    );
    expect((await getConfigurationVersions(byWebsiteId(1))).scope.id).toBe(
      "idw",
    );
  });

  test("rejects ambiguous code-only history selectors", async () => {
    tree.push({ ...tree[0], id: "another-global", level: "custom" });
    await expect(getConfigurationVersions(byCode("global"))).rejects.toThrow(
      "AMBIGUOUS_SCOPE_CODE",
    );
    await expect(
      getConfigurationVersions(byCodeAndLevel("global", "global")),
    ).resolves.toMatchObject({ scope: { id: "id-global" } });
  });

  test("surfaces listing failures instead of returning empty history", async () => {
    files.list.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(getConfigurationVersions(selector)).rejects.toThrow(
      "storage unavailable",
    );
  });

  test("does not overwrite configuration when its authoritative file cannot be read", async () => {
    files.read.mockRejectedValueOnce(new Error("permission denied"));
    await expect(setCurrency("EUR")).rejects.toThrow("permission denied");
    expect(files.write).not.toHaveBeenCalled();
  });

  test("surfaces malformed snapshots without modifying live configuration", async () => {
    const first = await setCurrency("EUR");
    const versionPath = `versions/id-global/${first.id}.json`;
    const record = JSON.parse((await files.read(versionPath)).toString());
    record.snapshot.config[0].value = null;
    await files.write(versionPath, JSON.stringify(record));
    files.write.mockClear();
    await expect(
      restoreConfigurationVersion(selector, { versionId: first.id }),
    ).rejects.toThrow("VERSION_SNAPSHOT_INVALID");
    expect(files.write).not.toHaveBeenCalled();
  });

  test("reports a partial history failure while keeping persisted and cached configuration consistent", async () => {
    const write = files.write.getMockImplementation();
    expect.assert(write);
    files.write.mockImplementation(async (...args) => {
      if (args[0].startsWith("versions/")) {
        throw new Error("history write failed");
      }
      return await write(...args);
    });
    await expect(setCurrency("EUR")).rejects.toThrow(
      "VERSION_WRITE_FAILED: configuration was saved",
    );
    expect(
      JSON.parse((await files.read(path)).toString()).config[0].value,
    ).toBe("EUR");
    expect((await getConfiguration(selector)).config).toContainEqual(
      expect.objectContaining({ name: "currency", value: "EUR" }),
    );
  });

  test("rejects missing versions and malformed IDs", async () => {
    await expect(
      restoreConfigurationVersion(selector, { versionId: missingId }),
    ).rejects.toThrow("VERSION_NOT_FOUND");
    await expect(
      restoreConfigurationVersion(selector, { versionId: "../configuration" }),
    ).rejects.toThrow("INVALID_PARAMS");
    const first = await setCurrency("EUR");
    await expect(
      restoreConfigurationVersion(selector, {
        expectedLatestVersionId: "",
        versionId: first.id,
      }),
    ).rejects.toThrow("INVALID_PARAMS");
  });

  test("does not interpret a scope ID as a code", async () => {
    await expect(
      getConfigurationVersions(byScopeId("base_region")),
    ).rejects.toThrow("INVALID_SCOPE_ID");
  });

  test("rejects removed fields and incompatible field types before writing", async () => {
    const first = await setCurrency("EUR");
    initialize({ schema: [{ name: "currency", type: "boolean" }] });
    files.write.mockClear();
    await expect(
      restoreConfigurationVersion(selector, { versionId: first.id }),
    ).rejects.toThrow("VERSION_SNAPSHOT_INVALID");
    expect(files.write).not.toHaveBeenCalled();
    initialize({ schema: [{ name: "other", type: "text" }] });
    await expect(
      restoreConfigurationVersion(selector, { versionId: first.id }),
    ).rejects.toThrow("INVALID_PARAMS");
    expect(files.write).not.toHaveBeenCalled();
  });

  test("rejects historical list options no longer present in the current schema", async () => {
    await setConfiguration(
      { config: [{ name: "tags", value: ["a"] }] },
      selector,
    );
    const { versions } = await getConfigurationVersions(selector);
    initialize({
      schema: [
        {
          name: "tags",
          options: [{ label: "B", value: "b" }],
          selectionMode: "multiple",
          type: "list",
        },
      ],
    });
    files.write.mockClear();
    await expect(
      restoreConfigurationVersion(selector, { versionId: versions[0].id }),
    ).rejects.toThrow("unavailable list option");
    expect(files.write).not.toHaveBeenCalled();
  });

  test("reports invalid snapshot JSON explicitly", async () => {
    const first = await setCurrency("EUR");
    await files.write(`versions/id-global/${first.id}.json`, "{");
    await expect(getConfigurationVersions(selector)).rejects.toThrow(
      "VERSION_SNAPSHOT_INVALID: invalid JSON",
    );
    await expect(
      restoreConfigurationVersion(selector, { versionId: first.id }),
    ).rejects.toThrow("VERSION_SNAPSHOT_INVALID: invalid JSON");
  });

  test("rejects snapshots copied from another scope", async () => {
    const first = await setCurrency("EUR");
    const versionPath = `versions/id-global/${first.id}.json`;
    const record = JSON.parse((await files.read(versionPath)).toString());
    record.snapshot.scope.id = "idw";
    await files.write(versionPath, JSON.stringify(record));
    await expect(
      restoreConfigurationVersion(selector, { versionId: first.id }),
    ).rejects.toThrow("VERSION_SNAPSHOT_INVALID");
  });

  test("does not create history when saving live configuration fails", async () => {
    files.write.mockRejectedValueOnce(new Error("config write failed"));
    await expect(setCurrency("EUR")).rejects.toThrow("config write failed");
    expect((await getConfigurationVersions(selector)).versions).toEqual([]);
    await expect(files.read(path)).rejects.toThrow("ENOENT");
  });

  test("merges writes with the authoritative file instead of stale cached values", async () => {
    await setCurrency("EUR");
    const cached = JSON.stringify({
      config: [
        {
          name: "currency",
          origin: { code: "global", level: "global" },
          value: "stale",
        },
      ],
      scope: { code: "global", id: "id-global", level: "global" },
    });
    await state.put("configuration.global", JSON.stringify({ data: cached }));
    await setConfiguration(
      { config: [{ name: "enabled", value: true }] },
      selector,
    );
    expect((await getConfiguration(selector)).config).toContainEqual(
      expect.objectContaining({ name: "currency", value: "EUR" }),
    );
    const { versions } = await getConfigurationVersions(selector);
    expect(versions[0].change).toEqual({
      added: ["enabled"],
      removed: [],
      updated: [],
    });
  });
});
