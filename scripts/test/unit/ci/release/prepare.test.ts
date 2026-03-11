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
  PRE_JSON,
  PRE_JSON_EXIT,
  PUBLIC_AUTH_TOKEN,
  PUBLIC_REGISTRY_URL,
  RELEASE_BRANCH,
} from "#test/fixtures/release";

function stubPrepareEnv(values: {
  baseBranch: string;
  changesetConfigPath?: string;
  changesetPreStatePath?: string;
  registryAuthToken: string;
  registryUrl: string;
  releaseChannel: string;
}) {
  vi.stubEnv("BASE_BRANCH", values.baseBranch);
  vi.stubEnv("CHANGESET_CONFIG_PATH", values.changesetConfigPath ?? "");
  vi.stubEnv("CHANGESET_PRE_STATE_PATH", values.changesetPreStatePath ?? "");
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
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(
          1,
          "npm config set registry",
          [INTERNAL_REGISTRY_URL],
        );

        expect(exec.exec).toHaveBeenNthCalledWith(2, "npm config set", [
          `//artifactory.example.com/artifactory/api/npm/npm-internal/:_authToken=${INTERNAL_AUTH_TOKEN}`,
        ]);

        expect(core.exportVariable).toHaveBeenCalledWith(
          "npm_config_registry",
          INTERNAL_REGISTRY_URL,
        );
      },
    );
  });

  test("configures registry auth for a public release when changesets is not in pre mode", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_RELEASE_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: RELEASE_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: PUBLIC_AUTH_TOKEN,
          registryUrl: PUBLIC_REGISTRY_URL,
          releaseChannel: "public",
        });

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        expect(core.setFailed).not.toHaveBeenCalled();
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(
          1,
          "npm config set registry",
          [PUBLIC_REGISTRY_URL],
        );
        expect(exec.exec).toHaveBeenNthCalledWith(2, "npm config set", [
          `//registry.npmjs.org/:_authToken=${PUBLIC_AUTH_TOKEN}`,
        ]);

        expect(core.exportVariable).toHaveBeenCalledWith(
          "npm_config_registry",
          PUBLIC_REGISTRY_URL,
        );
      },
    );
  });

  test("exports npm_config_registry so changesets reads the correct registry from env", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));

        // changesets' getCorrectRegistry() reads process.env.npm_config_registry, not ~/.npmrc.
        // Without this export, it falls back to registry.npmjs.org and publish fails with ENEEDAUTH.
        expect(core.exportVariable).toHaveBeenCalledExactlyOnceWith(
          "npm_config_registry",
          INTERNAL_REGISTRY_URL,
        );
      },
    );
  });

  test("fails when the release channel is invalid", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
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

  test("fails when the configured base branch does not match", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_RELEASE_BRANCH,
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: "https://example.com/",
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when the changeset config does not declare a base branch", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": "{}",
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when an internal release is not in pre-release mode", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: "https://example.com/",
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when the pre-release state file exists without a mode", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
        ".changeset/pre.json": "{}",
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();

        await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
        expect(exec.exec).not.toHaveBeenCalled();
      },
    );
  });

  test("fails when a public release is still in pre-release mode", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_RELEASE_BRANCH,
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: RELEASE_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
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

  test("fails when an internal release is in a non-pre changeset mode", async () => {
    await withTempFiles(
      {
        ".changeset/config.json": CONFIG_JSON_MAIN_BRANCH,
        ".changeset/pre.json": PRE_JSON_EXIT,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl: INTERNAL_REGISTRY_URL,
          releaseChannel: "internal",
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
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
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
        ".changeset/pre.json": PRE_JSON,
      },
      async (tempDir) => {
        stubPrepareEnv({
          baseBranch: MAIN_BRANCH,
          changesetConfigPath: join(tempDir, ".changeset/config.json"),
          changesetPreStatePath: join(tempDir, ".changeset/pre.json"),
          registryAuthToken: INTERNAL_AUTH_TOKEN,
          registryUrl,
          releaseChannel: "internal",
        });

        const core = createCoreMock();
        const exec = createExecMock();
        exec.exec.mockResolvedValue(0);

        await prepare(asCore(core), asExec(exec));
        expect(exec.exec).toHaveBeenNthCalledWith(2, "npm config set", [
          `//artifactory.example.com/artifactory/api/npm/npm-internal/:_authToken=${INTERNAL_AUTH_TOKEN}`,
        ]);
      },
    );
  });
});
