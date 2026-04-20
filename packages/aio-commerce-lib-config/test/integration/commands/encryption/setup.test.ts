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

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import { exec, run } from "#commands/encryption/setup/main";
import { KEY_LENGTH_HEX, validateEncryptionKey } from "#utils/encryption";

const ENCRYPTION_KEY_ENV_VAR = "AIO_COMMERCE_CONFIG_ENCRYPTION_KEY";

describe("commands/encryption/setup", () => {
  afterEach(() => {
    delete process.env[ENCRYPTION_KEY_ENV_VAR];
  });

  describe("run", () => {
    test.each([
      {
        label: "with env file",
        files: { ".env": "" },
      },
      {
        label: "without env file",
        files: {} as Record<string, string>,
      },
    ])("generates and writes an encryption key when none exists ($label)", async ({
      files,
    }) => {
      await withTempFiles(files, async (tempDir) => {
        const envPath = join(tempDir, ".env");
        await run(envPath);

        const contents = await readFile(envPath, "utf-8");
        expect(contents).toContain(`${ENCRYPTION_KEY_ENV_VAR}=`);
        const match = contents.match(
          new RegExp(`${ENCRYPTION_KEY_ENV_VAR}=([a-f0-9]+)`),
        );

        const value = match?.[1];
        expect.assert(value, "Encryption key should be present in .env file");
        expect(() => validateEncryptionKey(value)).not.toThrow();
      });
    });

    test("does not overwrite an existing key", async () => {
      const existingKey = "a".repeat(KEY_LENGTH_HEX);
      await withTempFiles(
        { ".env": `${ENCRYPTION_KEY_ENV_VAR}=${existingKey}` },
        async (tempDir) => {
          const envPath = join(tempDir, ".env");
          await run(envPath);

          const contents = await readFile(envPath, "utf-8");
          expect(contents).toContain(
            `${ENCRYPTION_KEY_ENV_VAR}=${existingKey}`,
          );
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

    test.each<{ label: string; files: Record<string, string> }>([
      {
        label: "package.json found",
        files: { ".env": "", "package.json": "{}" },
      },
      {
        label: "package.json not found, falls back to cwd",
        files: { ".env": "" },
      },
    ] as const)("runs successfully and does not exit ($label)", async ({
      files,
    }) => {
      await withTempFiles(files, async (tempDir) => {
        await withChdir(tempDir, () => exec());
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });
  });
});
