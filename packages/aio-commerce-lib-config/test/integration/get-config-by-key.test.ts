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

import { getConfigurationByKey } from "#config-manager";
import { byCodeAndLevel } from "#config-utils";
import * as configRepository from "#modules/configuration/configuration-repository";
import { mockScopeTree } from "#test/fixtures/scope-tree";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";
import { encrypt, generateEncryptionKey } from "#utils/encryption";

import type { BusinessConfigSchema } from "#index";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

// Only the external I/O boundary is mocked — aio-lib-state and aio-lib-files
vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

const integrationSchema = [
  {
    name: "currency",
    type: "text",
    label: "Currency",
    default: "",
  },
  {
    name: "apiPassword",
    type: "password",
    label: "API Password",
    default: "",
  },
] satisfies BusinessConfigSchema;

function buildPayload(
  id: string,
  code: string,
  level: string,
  entries: Array<{
    name: string;
    value: any;
    origin?: { code: string; level: string };
  }>,
) {
  return JSON.stringify({
    scope: { id, code, level },
    config: entries,
  });
}

describe("getConfigurationByKey", () => {
  beforeEach(async () => {
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();

    // Seed external storage with the scope tree and schema so all internal
    // repositories can read them without being mocked
    await mockFilesInstance.write(
      "aio-commerce-config/scope-tree.json",
      JSON.stringify({
        scopes: mockScopeTree,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      }),
    );
    await mockFilesInstance.write(
      "config-schema.json",
      JSON.stringify(integrationSchema),
    );

    // Clear spy call history after seeding so tests start with a clean slate
    vi.clearAllMocks();
  });

  test("returns the correct value for a non-password key", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "USD",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    const result = await getConfigurationByKey(
      "currency",
      byCodeAndLevel("global", "global"),
    );

    expect(result.scope.code).toBe("global");

    expect.assert.isNotNull(result.config);
    expect(result.config.name).toBe("currency");
    expect(result.config.value).toBe("USD");
  });

  test("returns null config when key does not exist in schema", async () => {
    const result = await getConfigurationByKey(
      "nonExistentKey",
      byCodeAndLevel("global", "global"),
    );

    expect(result.config).toBeNull();
  });

  test("does NOT require an encryption key when requesting a non-password field, even if password fields exist", async () => {
    const encryptionKey = generateEncryptionKey();
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "EUR",
          origin: { code: "global", level: "global" },
        },
        {
          name: "apiPassword",
          value: encrypt("s3cr3t", encryptionKey),
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    // No encryptionKey passed in options — should succeed because we're requesting a text field
    await expect(
      getConfigurationByKey("currency", byCodeAndLevel("global", "global")),
    ).resolves.toMatchObject({
      config: { name: "currency", value: "EUR" },
    });
  });

  test("decrypts the value when requesting a password field with an encryption key", async () => {
    const encryptionKey = generateEncryptionKey();
    const plainText = "super-secret-password";

    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "apiPassword",
          value: encrypt(plainText, encryptionKey),
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    const result = await getConfigurationByKey(
      "apiPassword",
      byCodeAndLevel("global", "global"),
      { encryptionKey },
    );

    expect(result.config?.value).toBe(plainText);
  });

  test("throws when requesting a password field that has a value but no encryption key is provided", async () => {
    const encryptionKey = generateEncryptionKey();
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "apiPassword",
          value: encrypt("some-password", encryptionKey),
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    await expect(
      getConfigurationByKey("apiPassword", byCodeAndLevel("global", "global")),
    ).rejects.toThrow("Encryption key has not been given");
  });

  test("returns null config for a password field with an empty value without requiring encryption key", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "apiPassword",
          value: "",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    // Empty password value, no decryption needed, no key required
    const result = await getConfigurationByKey(
      "apiPassword",
      byCodeAndLevel("global", "global"),
    );

    expect(result.config?.value).toBe("");
  });

  test("returns scope information alongside the config value", async () => {
    await configRepository.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "JPY",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    const result = await getConfigurationByKey(
      "currency",
      byCodeAndLevel("global", "global"),
    );

    expect(result.scope).toEqual({
      id: "id-global",
      code: "global",
      level: "global",
    });
  });
});
