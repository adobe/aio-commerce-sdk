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

import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import { exec, run } from "#commands/encryption/validate/main";
import { generateEncryptionKey } from "#utils/encryption";

vi.mock("consola");

const ENCRYPTION_KEY_ENV_VAR = "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY";

describe("commands/encryption/validate", () => {
  afterEach(() => {
    delete process.env[ENCRYPTION_KEY_ENV_VAR];
  });

  describe("run", () => {
    test("throws when no encryption key is set in the .env file", async () => {
      await withTempFiles(
        { ".env": "", "package.json": "{}" },
        async (tempDir) => {
          const envPath = join(tempDir, ".env");
          await expect(run(envPath)).rejects.toThrow();
        },
      );
    });

    test("succeeds when a valid encryption key is present", async () => {
      const validKey = generateEncryptionKey();
      await withTempFiles(
        {
          ".env": `${ENCRYPTION_KEY_ENV_VAR}=${validKey}`,
          "package.json": "{}",
        },
        async (tempDir) => {
          const envPath = join(tempDir, ".env");
          await expect(run(envPath)).resolves.not.toThrow();
        },
      );
    });

    test("throws when the encryption key is invalid", async () => {
      await withTempFiles(
        {
          ".env": `${ENCRYPTION_KEY_ENV_VAR}=not-a-valid-key`,
          "package.json": "{}",
        },
        async (tempDir) => {
          const envPath = join(tempDir, ".env");
          await expect(run(envPath)).rejects.toThrow();
        },
      );
    });
  });

  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      exitSpy.mockClear();
    });

    test("runs successfully and does not exit when key is valid", async () => {
      const validKey = generateEncryptionKey();
      await withTempFiles(
        {
          ".env": `${ENCRYPTION_KEY_ENV_VAR}=${validKey}`,
          "package.json": "{}",
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).not.toHaveBeenCalled();
        },
      );
    });

    test("calls process.exit(1) when .env file is missing", async () => {
      await withTempFiles({}, async (tempDir) => {
        await withChdir(tempDir, () => exec());
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
