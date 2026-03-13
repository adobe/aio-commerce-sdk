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

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import prepare from "#ci/release/prepare";
import {
  asCore,
  asExec,
  CONFIG_JSON_MAIN_BRANCH,
  CONFIG_JSON_RELEASE_BRANCH,
  createCoreMock,
  createExecMock,
  INTERNAL_AUTH_TOKEN,
  INTERNAL_REGISTRY_URL,
  MAIN_BRANCH,
  PUBLIC_AUTH_TOKEN,
  PUBLIC_REGISTRY_URL,
  RELEASE_BRANCH,
} from "#test/fixtures/release";

function stubPrepareEnv(values: {
  baseBranch: string;
  changesetConfigPath?: string;
  registryAuthToken: string;
  registryUrl: string;
  releaseChannel: string;
}) {
  vi.stubEnv("BASE_BRANCH", values.baseBranch);
  vi.stubEnv("CHANGESET_CONFIG_PATH", values.changesetConfigPath ?? "");
  vi.stubEnv("REGISTRY_AUTH_TOKEN", values.registryAuthToken);
  vi.stubEnv("REGISTRY_URL", values.registryUrl);
  vi.stubEnv("RELEASE_CHANNEL", values.releaseChannel);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("release/prepare.ts", () => {
  test("configures registry auth for an internal release", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(exec.exec).toHaveBeenCalledOnce();
        expect(exec.exec).toHaveBeenCalledWith("pnpm whoami", [
          "--userconfig",
          `${tempDir}/.npmrc`,
          "--registry",
          INTERNAL_REGISTRY_URL,
        ]);

        const npmrc = readFileSync(join(tempDir, ".npmrc"), "utf8");
        expect(npmrc).toContain(
          `//artifactory.example.com/artifactory/api/npm/npm-internal/:_authToken=${INTERNAL_AUTH_TOKEN}`,
        );
      },
    );
  });

  test("configures registry auth for a public release", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_RELEASE_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: RELEASE_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: PUBLIC_AUTH_TOKEN,
          registryUrl: PUBLIC_REGISTRY_URL,
          releaseChannel: "public",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(exec.exec).not.toHaveBeenCalled();

        const npmrc = readFileSync(join(tempDir, ".npmrc"), "utf8");
        expect(npmrc).toContain(
          `//registry.npmjs.org/:_authToken=${PUBLIC_AUTH_TOKEN}`,
        );
      },
    );
  });

  test("skips base branch validation for internal releases", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_RELEASE_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        // Should NOT throw even though baseBranch doesn't match config
        await prepare(asCore(core), asExec(exec));

        expect(core.setFailed).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when the release channel is invalid", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: "https://example.com/",
          releaseChannel: "beta",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when the configured base branch does not match for public releases", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: RELEASE_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: PUBLIC_AUTH_TOKEN,
          registryUrl: PUBLIC_REGISTRY_URL,
          releaseChannel: "public",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when the changeset config does not declare a base branch for public releases", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": "{}",
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: RELEASE_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: PUBLIC_AUTH_TOKEN,
          registryUrl: PUBLIC_REGISTRY_URL,
          releaseChannel: "public",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when registry authentication values are missing", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: "",
          registryUrl: "",
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("configures registry auth for an internal registry URL without a trailing slash", async () => {
    const registryUrl =
      "https://artifactory.example.com/artifactory/api/npm/npm-internal";

    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl,
          releaseChannel: "internal",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        const npmrc = readFileSync(join(tempDir, ".npmrc"), "utf8");
        expect(npmrc).toContain(
          `//artifactory.example.com/artifactory/api/npm/npm-internal/:_authToken=${INTERNAL_AUTH_TOKEN}`,
        );

        expect(exec.exec).toHaveBeenCalledWith("pnpm whoami", [
          "--userconfig",
          `${tempDir}/.npmrc`,
          "--registry",
          registryUrl,
        ]);
      },
    );
  });

  test("logs a warning when the registry auth check fails with an Error", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockRejectedValueOnce(new Error("ENEEDAUTH")); // pnpm whoami

        await prepare(asCore(core), asExec(exec));

        expect(core.warning).toHaveBeenCalledWith(
          expect.stringContaining("ENEEDAUTH"),
        );
      },
    );
  });

  test("logs a warning when the registry auth check fails with a non-Error value", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        vi.stubEnv("GITHUB_WORKSPACE", tempDir);

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockRejectedValueOnce("auth failed");

        await prepare(asCore(core), asExec(exec));

        expect(core.warning).toHaveBeenCalledWith(
          expect.stringContaining("auth failed"),
        );
      },
    );
  });
});
