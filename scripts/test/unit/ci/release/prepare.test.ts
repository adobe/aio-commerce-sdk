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
  createCoreMock,
  createExecMock,
} from "#test/fixtures/release";

function stubPrepareEnv(releaseChannel: string) {
  vi.stubEnv("RELEASE_CHANNEL", releaseChannel);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("release/prepare.ts", () => {
  test("prepares snapshot for an internal release", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv("internal");
      vi.stubEnv("GITHUB_WORKSPACE", tempDir);

      const core = createCoreMock();
      const exec = createExecMock();
      exec.exec.mockResolvedValue(0);

      await prepare(asCore(core), asExec(exec));

      expect(core.setFailed).not.toHaveBeenCalled();

      expect(exec.exec).toHaveBeenCalledWith("git", ["fetch", "--unshallow"]);
      expect(exec.exec).toHaveBeenCalledWith("git", [
        "fetch",
        "origin",
        "release:release",
      ]);
      expect(exec.exec).toHaveBeenCalledWith("pnpm", [
        "changeset",
        "status",
        "--output",
        join(tempDir, "changeset-status.json"),
      ]);
      expect(exec.exec).toHaveBeenCalledWith("pnpm", [
        "changeset",
        "version",
        "--snapshot",
        "beta",
      ]);
    });
  });

  test("fails when the release channel is invalid", async () => {
    stubPrepareEnv("beta");

    const core = createCoreMock();
    const exec = createExecMock();

    await expect(prepare(asCore(core), asExec(exec))).rejects.toThrow();
    expect(exec.exec).not.toHaveBeenCalled();
  });

  test("warns but continues when release branch fetch fails", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv("internal");
      vi.stubEnv("GITHUB_WORKSPACE", tempDir);

      const core = createCoreMock();
      const exec = createExecMock();
      exec.exec
        .mockRejectedValueOnce(
          new Error("fatal: --unshallow on a complete repository"),
        ) // git fetch --unshallow fails
        .mockResolvedValueOnce(0) // changeset status (still attempted)
        .mockResolvedValueOnce(0); // changeset version

      await prepare(asCore(core), asExec(exec));

      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining("Could not fetch release branch"),
      );
    });
  });

  test("uses custom snapshot tag from SNAPSHOT_TAG env var", async () => {
    await withTempFiles({}, async (tempDir) => {
      stubPrepareEnv("internal");
      vi.stubEnv("GITHUB_WORKSPACE", tempDir);
      vi.stubEnv("SNAPSHOT_TAG", "alpha");

      const core = createCoreMock();
      const exec = createExecMock();
      exec.exec.mockResolvedValue(0);

      await prepare(asCore(core), asExec(exec));

      expect(exec.exec).toHaveBeenCalledWith("pnpm", [
        "changeset",
        "version",
        "--snapshot",
        "alpha",
      ]);
    });
  });

  test("skips snapshot preparation for public releases", async () => {
    stubPrepareEnv("public");

    const core = createCoreMock();
    const exec = createExecMock();

    await prepare(asCore(core), asExec(exec));

    // No git or changeset commands should run for public releases
    expect(exec.exec).not.toHaveBeenCalledWith("git", expect.anything());
    expect(exec.exec).not.toHaveBeenCalledWith(
      "pnpm",
      expect.arrayContaining(["changeset"]),
    );
  });
});
