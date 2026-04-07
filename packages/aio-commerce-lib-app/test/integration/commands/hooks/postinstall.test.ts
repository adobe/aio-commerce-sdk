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

import {
  withChdir,
  withTempFiles,
} from "@aio-commerce-sdk/scripting-utils/filesystem";
import { afterEach, describe, expect, test, vi } from "vitest";

import { exec } from "#commands/hooks/postinstall";

describe("commands/hooks/postinstall", () => {
  describe("exec", () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    afterEach(() => {
      vi.clearAllMocks();
      exitSpy.mockClear();
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
          "package.json": "{}",
          "app.commerce.config.js": "module.exports = {}",
        },
        async (tempDir) => {
          await withChdir(tempDir, () => exec());
          expect(exitSpy).toHaveBeenCalledWith(1);
        },
      );
    });
  });
});
