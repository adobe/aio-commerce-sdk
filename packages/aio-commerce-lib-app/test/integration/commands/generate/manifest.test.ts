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
import { stringify } from "safe-stable-stringify";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  APP_MANIFEST_FILE,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { exec, run } from "#commands/generate/manifest/main";
import {
  fullConfig,
  minimalValidConfig,
  mockMetadata,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

function makeConfigFile(config: object) {
  return `module.exports = ${stringify(config)}`;
}

function sha256(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function getManifestPath(tempDir: string) {
  return join(
    tempDir,
    getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
    ".generated",
    APP_MANIFEST_FILE,
  );
}

describe("commands/generate/manifest", () => {
  describe("run", () => {
    test("writes manifest JSON to the extensibility extension point directory", async () => {
      await withTempFiles({ "package.json": "{}" }, async (tempDir) => {
        await withChdir(tempDir, () => run(minimalValidConfig));

        const contents = await readFile(getManifestPath(tempDir), "utf-8");
        expect(JSON.parse(contents)).toEqual(minimalValidConfig);
      });
    });

    test("produces identical checksum for equivalent configs with different key order", async () => {
      // Same values, but properties declared in reverse order
      const configA: CommerceAppConfigOutputModel = {
        metadata: mockMetadata,
        businessConfig: fullConfig.businessConfig,
        eventing: fullConfig.eventing,
      };

      const configB: CommerceAppConfigOutputModel = {
        eventing: fullConfig.eventing,
        businessConfig: fullConfig.businessConfig,
        metadata: mockMetadata,
      };

      await withTempFiles({ "package.json": "{}" }, async (tempDirA) => {
        await withChdir(tempDirA, () => run(configA));
        const hashA = sha256(
          await readFile(getManifestPath(tempDirA), "utf-8"),
        );

        await withTempFiles({ "package.json": "{}" }, async (tempDirB) => {
          await withChdir(tempDirB, () => run(configB));
          const hashB = sha256(
            await readFile(getManifestPath(tempDirB), "utf-8"),
          );

          expect(hashA).toBe(hashB);
        });
      });
    });

    test("serializes all config fields", async () => {
      await withTempFiles({ "package.json": "{}" }, async (tempDir) => {
        await withChdir(tempDir, () => run(fullConfig));

        const outputPath = join(
          tempDir,
          getExtensionPointFolderPath(EXTENSIBILITY_EXTENSION_POINT_ID),
          ".generated",
          APP_MANIFEST_FILE,
        );

        const parsed = JSON.parse(await readFile(outputPath, "utf-8"));

        expect(parsed.metadata).toEqual(fullConfig.metadata);
        expect(parsed.businessConfig).toEqual(fullConfig.businessConfig);
        expect(parsed.eventing).toBeDefined();
        expect(parsed.webhooks).toBeDefined();
        expect(parsed.installation).toBeDefined();
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

    test("succeeds when a valid config file exists", async () => {
      await withTempFiles(
        {
          "app.commerce.config.js": makeConfigFile(minimalValidConfig),
          "package.json": "{}",
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).not.toHaveBeenCalled();

          const contents = await readFile(getManifestPath(tempDir), "utf-8");
          expect(JSON.parse(contents)).toEqual(minimalValidConfig);
        },
      );
    });

    test("exits with 1 when config file is missing", async () => {
      await withTempFiles({ "package.json": "{}" }, async (tempDir) => {
        await withChdir(tempDir, () => exec());
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    test("exits with 1 when config file is invalid", async () => {
      await withTempFiles(
        {
          "app.commerce.config.js": "module.exports = {}",
          "package.json": "{}",
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });

    test("exits with 1 and handles CommerceSdkValidationError", async () => {
      await withTempFiles(
        {
          // Valid default export but fails schema validation
          "app.commerce.config.js": makeConfigFile({ metadata: { id: 123 } }),
          "package.json": "{}",
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });
  });
});
