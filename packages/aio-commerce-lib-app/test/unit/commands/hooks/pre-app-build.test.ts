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

import consola from "consola";
import { afterEach, describe, expect, test, vi } from "vitest";

import { run } from "#commands/hooks/pre-app-build";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const { mockLoadAppManifest } = vi.hoisted(() => ({
  mockLoadAppManifest: vi.fn(),
}));

// The hook loads the app manifest from disk; we control its return value
// directly so we can drive the metadata used by the release-notes check.
vi.mock("#commands/utils", () => ({
  loadAppManifest: mockLoadAppManifest,
}));

// Avoid touching the filesystem for the runtime config module preparation —
// it's unrelated to the release-notes warning under test.
vi.mock("#commands/generate/actions/lib", () => ({
  prepareRuntimeAppConfigModule: vi.fn(),
}));

/** Builds a minimal manifest with no adminUi so the `backend-ui/2` branch is a no-op after the metadata check. */
function makeManifest(
  metadata: CommerceAppConfigOutputModel["metadata"],
): CommerceAppConfigOutputModel {
  return { metadata } as CommerceAppConfigOutputModel;
}

describe("commands/hooks/pre-app-build", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("release notes warning", () => {
    test("warns when releaseNotes has no entry for the current version", async () => {
      mockLoadAppManifest.mockResolvedValue(
        makeManifest({
          description: "d",
          displayName: "d",
          id: "app",
          releaseNotes: [{ notes: "old", version: "1.0.0" }],
          updateType: "manual",
          version: "2.0.0",
        }),
      );

      await expect(run("backend-ui/2")).resolves.not.toThrow();

      expect(consola.warn).toHaveBeenCalledWith(
        expect.stringContaining("2.0.0"),
      );
    });

    test("warns when releaseNotes is entirely absent", async () => {
      mockLoadAppManifest.mockResolvedValue(
        makeManifest({
          description: "d",
          displayName: "d",
          id: "app",
          updateType: "manual",
          version: "3.0.0",
        }),
      );

      await run("backend-ui/2");

      expect(consola.warn).toHaveBeenCalledWith(
        expect.stringContaining("3.0.0"),
      );
    });

    test("does not warn when releaseNotes has an entry for the current version", async () => {
      mockLoadAppManifest.mockResolvedValue(
        makeManifest({
          description: "d",
          displayName: "d",
          id: "app",
          releaseNotes: [{ notes: "current", version: "2.0.0" }],
          updateType: "manual",
          version: "2.0.0",
        }),
      );

      await run("backend-ui/2");

      expect(consola.warn).not.toHaveBeenCalled();
    });

    test("never throws or exits for the missing-notes condition", async () => {
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      mockLoadAppManifest.mockResolvedValue(
        makeManifest({
          description: "d",
          displayName: "d",
          id: "app",
          updateType: "manual",
          version: "4.0.0",
        }),
      );

      await expect(run("backend-ui/2")).resolves.not.toThrow();
      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });
  });
});
