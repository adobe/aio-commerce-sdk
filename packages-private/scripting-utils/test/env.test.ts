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

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { syncImsCredentials } from "#env";
import { withTempFiles } from "#filesystem/temp";

// Mock the external dependencies
vi.mock("@adobe/aio-lib-core-config", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@adobe/aio-lib-ims", () => ({
  default: {
    context: {
      get: vi.fn(),
    },
  },
}));

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import aioIms from "@adobe/aio-lib-ims";

const { context } = aioIms;

describe("syncImsCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // biome-ignore lint/performance/noDelete: Just for testing purposes.
    delete process.env.INIT_CWD;
  });

  test("should do nothing when no IMS context is found", async () => {
    vi.mocked(config.get).mockReturnValue([]);
    await withTempFiles(
      {
        ".env": "SOME_VAR=value\n",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toBe("SOME_VAR=value\n");
      },
    );
  });

  test("should do nothing when no oauth_server_to_server credential is found", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "jwt", name: "jwt-context" },
    ]);

    await withTempFiles(
      {
        ".env": "SOME_VAR=value\n",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toBe("SOME_VAR=value\n");
      },
    );
  });

  test("should sync IMS credentials to .env file when they do not exist", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "test-client-id",
        client_secrets: "test-secret",
        ims_org_id: "test-org-id",
      },
    });

    await withTempFiles(
      {
        ".env": "EXISTING_VAR=existing\n",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain("EXISTING_VAR=existing");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=test-client-id",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS =test-secret",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_ORG_ID=test-org-id",
        );
      },
    );
  });

  test("should update existing IMS credentials when values differ", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "new-client-id",
      },
    });

    await withTempFiles(
      {
        ".env": "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=old-client-id\n",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=new-client-id",
        );
        expect(envContent).not.toContain("old-client-id");
      },
    );
  });

  test("should not update IMS credentials when values are the same", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "same-client-id",
      },
    });

    const originalEnv = "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=same-client-id\n";
    await withTempFiles(
      {
        ".env": originalEnv,
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        // Content should be identical (no unnecessary writes)
        expect(envContent).toBe(originalEnv);
      },
    );
  });

  test("should skip keys that are not in IMS_KEYS mapping", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "test-client-id",
        unknown_key: "should-be-ignored",
        another_unknown: "also-ignored",
      },
    });

    await withTempFiles(
      {
        ".env": "",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=test-client-id",
        );
        expect(envContent).not.toContain("unknown_key");
        expect(envContent).not.toContain("should-be-ignored");
        expect(envContent).not.toContain("another_unknown");
      },
    );
  });

  test("should preserve comments in .env file", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "test-client-id",
      },
    });

    await withTempFiles(
      {
        ".env": "# This is a comment\nEXISTING=value\n",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain("# This is a comment");
        expect(envContent).toContain("EXISTING=value");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=test-client-id",
        );
      },
    );
  });

  test("should quote values with spaces", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        scopes: "scope1 scope2 scope3",
      },
    });

    await withTempFiles(
      {
        ".env": "",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain(
          'AIO_COMMERCE_AUTH_IMS_SCOPES="scope1 scope2 scope3"',
        );
      },
    );
  });

  test("should sync all supported IMS keys", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "oauth_server_to_server", name: "my-s2s-context" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "my-s2s-context",
      data: {
        client_id: "test-client-id",
        client_secrets: "test-secret",
        technical_account_email: "test@example.com",
        technical_account_id: "tech-account-123",
        scopes: "scope1,scope2",
        ims_org_id: "org-id-456",
      },
    });

    await withTempFiles(
      {
        ".env": "",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=test-client-id",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS =test-secret",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL =test@example.com",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID=tech-account-123",
        );
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_SCOPES=scope1,scope2",
        );
        expect(envContent).toContain("AIO_COMMERCE_AUTH_IMS_ORG_ID=org-id-456");
      },
    );
  });

  test("should use first oauth_server_to_server credential when multiple exist", async () => {
    vi.mocked(config.get).mockReturnValue([
      { integration_type: "jwt", name: "jwt-context" },
      { integration_type: "oauth_server_to_server", name: "first-s2s" },
      { integration_type: "oauth_server_to_server", name: "second-s2s" },
    ]);

    vi.mocked(context.get).mockResolvedValue({
      name: "first-s2s",
      data: {
        client_id: "first-client-id",
      },
    });

    await withTempFiles(
      {
        ".env": "",
      },
      async (tempDir) => {
        process.env.INIT_CWD = tempDir;
        await syncImsCredentials();

        expect(context.get).toHaveBeenCalledWith("first-s2s");
        const envContent = readFileSync(join(tempDir, ".env"), "utf8");
        expect(envContent).toContain(
          "AIO_COMMERCE_AUTH_IMS_CLIENT_ID=first-client-id",
        );
      },
    );
  });
});
