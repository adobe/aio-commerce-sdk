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

import { run } from "#commands/hooks/pre-app-build";
import {
  configWithFullAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

vi.mock("#commands/utils", () => ({
  loadAppManifest: vi.fn(),
}));

vi.mock("#commands/generate/manifest/main", () => ({
  run: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("#commands/generate/schema/main", () => ({
  run: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("#commands/generate/actions/main", () => ({
  generateRegistrationActionFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@aio-commerce-sdk/scripting-utils/env", () => ({
  syncImsCredentials: vi.fn().mockResolvedValue(undefined),
}));

import { BACKEND_UI_EXTENSION_POINT_ID } from "#commands/constants";
import { generateRegistrationActionFile } from "#commands/generate/actions/main";
import { run as generateManifestCommand } from "#commands/generate/manifest/main";
import { run as generateSchemaCommand } from "#commands/generate/schema/main";
import { loadAppManifest } from "#commands/utils";

describe("pre-app-build hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extensibility/1", () => {
    test("calls generateManifestCommand and syncs IMS credentials", async () => {
      vi.mocked(loadAppManifest).mockResolvedValue(minimalValidConfig);
      await run("extensibility/1");
      expect(vi.mocked(generateManifestCommand)).toHaveBeenCalledWith(
        minimalValidConfig,
      );
    });
  });

  describe("configuration/1", () => {
    test("calls generateSchemaCommand", async () => {
      vi.mocked(loadAppManifest).mockResolvedValue(minimalValidConfig);
      await run("configuration/1");
      expect(vi.mocked(generateSchemaCommand)).toHaveBeenCalledWith(
        minimalValidConfig,
      );
    });
  });

  describe("backend-ui/1", () => {
    test("calls generateRegistrationActionFile when adminUiSdk is configured", async () => {
      vi.mocked(loadAppManifest).mockResolvedValue(configWithFullAdminUiSdk);
      await run("backend-ui/1");
      expect(vi.mocked(generateRegistrationActionFile)).toHaveBeenCalledWith(
        configWithFullAdminUiSdk,
        BACKEND_UI_EXTENSION_POINT_ID,
      );
    });

    test("does not call generateRegistrationActionFile when adminUiSdk is absent", async () => {
      vi.mocked(loadAppManifest).mockResolvedValue(minimalValidConfig);
      await run("backend-ui/1");
      expect(vi.mocked(generateRegistrationActionFile)).not.toHaveBeenCalled();
    });
  });

  describe("unsupported extension", () => {
    test("throws for unknown extension", async () => {
      vi.mocked(loadAppManifest).mockResolvedValue(minimalValidConfig);
      await expect(
        run("unknown/1" as Parameters<typeof run>[0]),
      ).rejects.toThrow("Unsupported extension");
    });
  });
});
