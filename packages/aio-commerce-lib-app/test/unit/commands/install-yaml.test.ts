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

import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  ensureExtensionPointsOrder,
  isExtensionPointsOrdered,
} from "#commands/install-yaml";

const UI_COMMENT_RE =
  /# ui comment\s+- extensionPointId: commerce\/backend-ui\/2/;
const EXT_COMMENT_RE =
  /# ext comment\s+- extensionPointId: commerce\/extensibility\/1/;
const ID_RE = /extensionPointId: (\S+)/g;

const ORDERED = `name: app

extensions:
  # ui comment
  - extensionPointId: commerce/backend-ui/2

  # config comment
  - extensionPointId: commerce/configuration/1

  # ext comment
  - extensionPointId: commerce/extensibility/1
`;

const SHUFFLED = `name: app

extensions:
  # ext comment
  - extensionPointId: commerce/extensibility/1

  # ui comment
  - extensionPointId: commerce/backend-ui/2

  # config comment
  - extensionPointId: commerce/configuration/1
`;

describe("commands/install-yaml", () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "install-yaml-helper-"));
    file = join(dir, "install.yaml");
  });

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true });
  });

  const ids = async () =>
    [...(await readFile(file, "utf-8")).matchAll(ID_RE)].map((m) => m[1]);

  describe("isExtensionPointsOrdered", () => {
    test("is true when the file is missing", async () => {
      expect(await isExtensionPointsOrdered(dir)).toBe(true);
    });

    test("is true when the file has no extensions", async () => {
      await writeFile(file, "name: app\n");
      expect(await isExtensionPointsOrdered(dir)).toBe(true);
    });

    test("is true for the required order and false otherwise", async () => {
      await writeFile(file, ORDERED);
      expect(await isExtensionPointsOrdered(dir)).toBe(true);

      await writeFile(file, SHUFFLED);
      expect(await isExtensionPointsOrdered(dir)).toBe(false);
    });

    test("does not modify the file", async () => {
      await writeFile(file, SHUFFLED);
      const before = await stat(file);
      await isExtensionPointsOrdered(dir);

      expect(await readFile(file, "utf-8")).toBe(SHUFFLED);
      expect((await stat(file)).mtimeMs).toBe(before.mtimeMs);
    });
  });

  describe("ensureExtensionPointsOrder", () => {
    test("does not create a missing file", async () => {
      expect(await ensureExtensionPointsOrder(dir)).toBe(false);
      expect(existsSync(file)).toBe(false);
    });

    test("does not write when already ordered", async () => {
      await writeFile(file, ORDERED);
      const before = await stat(file);

      expect(await ensureExtensionPointsOrder(dir)).toBe(false);
      expect(await readFile(file, "utf-8")).toBe(ORDERED);
      expect((await stat(file)).mtimeMs).toBe(before.mtimeMs);
    });

    test("reorders a shuffled file and keeps comments and blank lines", async () => {
      await writeFile(file, SHUFFLED);

      expect(await ensureExtensionPointsOrder(dir)).toBe(true);
      expect(await ids()).toEqual([
        "commerce/backend-ui/2",
        "commerce/configuration/1",
        "commerce/extensibility/1",
      ]);

      const content = await readFile(file, "utf-8");
      expect(content).toContain("# ui comment");
      expect(content).toContain("# config comment");
      expect(content).toContain("# ext comment");
      expect(content).toContain("name: app");
      expect(await isExtensionPointsOrdered(dir)).toBe(true);
    });

    test("moves each comment together with its extension point", async () => {
      await writeFile(file, SHUFFLED);
      await ensureExtensionPointsOrder(dir);

      const content = await readFile(file, "utf-8");
      expect(content).toMatch(UI_COMMENT_RE);
      expect(content).toMatch(EXT_COMMENT_RE);
    });

    test("puts unknown ids last without throwing and keeps their order", async () => {
      await writeFile(
        file,
        `extensions:
  - extensionPointId: other/b/1
  - extensionPointId: commerce/extensibility/1
  - extensionPointId: other/a/1
  - extensionPointId: commerce/backend-ui/2
`,
      );

      await ensureExtensionPointsOrder(dir);
      expect(await ids()).toEqual([
        "commerce/backend-ui/2",
        "commerce/extensibility/1",
        "other/b/1",
        "other/a/1",
      ]);
    });
  });
});
