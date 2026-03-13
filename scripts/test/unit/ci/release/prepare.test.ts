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
  createCoreMock,
  createExecMock,
  INTERNAL_AUTH_TOKEN,
  INTERNAL_REGISTRY_URL,
  PUBLIC_AUTH_TOKEN,
  PUBLIC_REGISTRY_URL,
} from "#test/fixtures/release";

function stubPrepareEnv(values: {
  registryAuthToken: string;
  registryUrl: string;
  releaseChannel: string;
}) {
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
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv({
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
    });
  });

  test("configures registry auth for a public release", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv({
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
    });
  });

  test("fails when the release channel is invalid", async () => {
    stubPrepareEnv({
      registryAuthToken: INTERNAL_AUTH_TOKEN,
      registryUrl: "https://example.com/",
      releaseChannel: "beta",
    });

    const core = createCoreMock();
    const exec = createExecMock();

    await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
    expect(exec.exec).not.toHaveBeenCalled();
  });

  test("fails when registry authentication values are missing", async () => {
    stubPrepareEnv({
      registryAuthToken: "",
      registryUrl: "",
      releaseChannel: "internal",
    });

    const core = createCoreMock();
    const exec = createExecMock();

    await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
    expect(exec.exec).not.toHaveBeenCalled();
  });

  test("configures registry auth for an internal registry URL without a trailing slash", async () => {
    const registryUrl =
      "https://artifactory.example.com/artifactory/api/npm/npm-internal";

    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv({
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
    });
  });

  test("logs a warning when the registry auth check fails with an Error", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv({
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
    });
  });

  test("logs a warning when the registry auth check fails with a non-Error value", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv({
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
    });
  });
});
