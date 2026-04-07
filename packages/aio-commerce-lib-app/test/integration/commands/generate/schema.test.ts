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

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  CONFIG_SCHEMA_FILE_NAME,
  CONFIGURATION_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/generate/schema/main";
import {
  configWithBusinessConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  EMPTY_PROJECT,
  envObject,
  makeProjectFiles,
} from "#test/fixtures/project";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function getSchemaPath(tempDir: string) {
  return join(
    tempDir,
    getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID),
    ".generated",
    CONFIG_SCHEMA_FILE_NAME,
  );
}

// execSync shells out to aio-commerce-lib-config encryption commands
// which aren't resolvable from the temp dir (external boundary), mock is required
const mockExecSync = vi.fn();
vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

describe("commands/generate/schema", () => {
  afterEach(() => {
    mockExecSync.mockClear();
    vi.unstubAllEnvs();
  });

  describe("run", () => {
    test("skips generation when config has no business config schema", async () => {
      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        await withChdir(tempDir, () => run(minimalValidConfig));
        const outputDir = join(
          tempDir,
          getExtensionPointFolderPath(CONFIGURATION_EXTENSION_POINT_ID),
          ".generated",
        );

        await expect(
          readFile(join(outputDir, CONFIG_SCHEMA_FILE_NAME), "utf-8"),
        ).rejects.toThrow();
      });
    });

    test("writes schema JSON when business config schema is present", async () => {
      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        await withChdir(tempDir, () => run(configWithBusinessConfig));
        const parsed = JSON.parse(
          await readFile(getSchemaPath(tempDir), "utf-8"),
        );

        expect(parsed).toEqual(configWithBusinessConfig.businessConfig.schema);
      });
    });

    test("produces identical checksum for equivalent schemas with different key order", async () => {
      const schemaA: CommerceAppConfigOutputModel = {
        ...configWithBusinessConfig,
        businessConfig: {
          schema: [
            { name: "field", label: "Field", type: "text", default: "val" },
          ],
        },
      };

      // Same values, different property insertion order within each schema field
      const schemaB: CommerceAppConfigOutputModel = {
        metadata: configWithBusinessConfig.metadata,
        businessConfig: {
          schema: [
            { default: "val", type: "text", label: "Field", name: "field" },
          ],
        },
      };

      await withTempFiles(EMPTY_PROJECT, async (tempDirA) => {
        await withChdir(tempDirA, () => run(schemaA));
        const hashA = sha256(await readFile(getSchemaPath(tempDirA), "utf-8"));

        await withTempFiles(EMPTY_PROJECT, async (tempDirB) => {
          await withChdir(tempDirB, () => run(schemaB));
          const hashB = sha256(
            await readFile(getSchemaPath(tempDirB), "utf-8"),
          );

          expect(hashA).toBe(hashB);
        });
      });
    });

    test("runs encryption validate when password fields exist and key is set", async () => {
      const configWithPassword: CommerceAppConfigOutputModel = {
        ...configWithBusinessConfig,
        businessConfig: {
          schema: [
            {
              name: "secret",
              label: "Secret",
              type: "password",
              default: "" as const,
            },
          ],
        },
      };

      await withTempFiles(
        makeProjectFiles(configWithPassword, "esm", {
          ".env": envObject({
            AIO_COMMERCE_CONFIG_ENCRYPTION_KEY: "some-valid-key",
          }),
        }),
        async (tempDir) => {
          await withChdir(tempDir, () => run(configWithPassword));
          expect(mockExecSync).toHaveBeenCalledWith(
            expect.stringContaining("encryption validate"),
          );
        },
      );
    });

    test("runs encryption setup when password fields exist but no key", async () => {
      const configWithPassword: CommerceAppConfigOutputModel = {
        ...configWithBusinessConfig,
        businessConfig: {
          schema: [
            {
              name: "secret",
              label: "Secret",
              type: "password",
              default: "" as const,
            },
          ],
        },
      };

      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        // Clear any leftover from previous tests — process.loadEnvFile doesn't overwrite existing vars
        vi.stubEnv("AIO_COMMERCE_CONFIG_ENCRYPTION_KEY", "");
        await withChdir(tempDir, () => run(configWithPassword));

        expect(mockExecSync).toHaveBeenCalledWith(
          expect.stringContaining("encryption setup"),
        );
      });
    });
  });

  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      exitSpy.mockClear();
    });

    test("succeeds when a valid config with schema exists", async () => {
      await withTempFiles(
        makeProjectFiles(configWithBusinessConfig, "esm"),
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).not.toHaveBeenCalled();

          const parsed = JSON.parse(
            await readFile(getSchemaPath(tempDir), "utf-8"),
          );

          expect(parsed).toEqual(
            configWithBusinessConfig.businessConfig.schema,
          );
        },
      );
    });

    test("exits with 1 when config file is missing", async () => {
      await withTempFiles(EMPTY_PROJECT, async (tempDir) => {
        await withChdir(tempDir, () => exec());
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("exits with 1 when config file is invalid", async () => {
      await withTempFiles(
        // @ts-expect-error Testing invalid config
        makeProjectFiles({}),
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });
  });
});
