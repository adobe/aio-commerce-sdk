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
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import {
  ensureExtensionPointsOrder,
  getExtensionPointRank,
  isExtensionPointsOrdered,
} from "#commands/common/extension-points";
import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import {
  makeAppConfigFile,
  ORDERED_EXTENSION_POINTS,
} from "#test/fixtures/project";

const UI_COMMENT_RE =
  /# ui comment\s+commerce\/backend-ui\/2:\s+\$include: \S+backend-ui-2\S+/;
const EXT_COMMENT_RE =
  /# ext comment\s+commerce\/extensibility\/1:\s+\$include: \S+extensibility-1\S+/;

const WITH_COMMENTS = {
  [APP_CONFIG_FILE]: `name: app

extensions:
  # ext comment
  ${EXTENSIBILITY_EXTENSION_POINT_ID}:
    $include: src/commerce-extensibility-1/ext.config.yaml

  # ui comment
  ${BACKEND_UI_V2_EXTENSION_POINT_ID}:
    $include: src/commerce-backend-ui-2/ext.config.yaml

  # config comment
  ${CONFIGURATION_EXTENSION_POINT_ID}:
    $include: src/commerce-configuration-1/ext.config.yaml
`,
};

const readIds = async (tempDir: string) =>
  Object.keys(
    parse(await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8")).extensions,
  );

describe("getExtensionPointRank", () => {
  test("ranks backend ui, configuration and extensibility in that order", () => {
    expect(
      ORDERED_EXTENSION_POINTS.map((id) => getExtensionPointRank(id)),
    ).toEqual([0, 1, 2]);
  });

  test("ranks unknown ids after every known one", () => {
    expect(getExtensionPointRank("other/a/1")).toBe(3);
    expect(getExtensionPointRank(undefined)).toBe(3);
  });
});

describe("isExtensionPointsOrdered", () => {
  test("is true when the file is missing", async () => {
    await withTempFiles({}, async (tempDir) => {
      expect(await isExtensionPointsOrdered(tempDir)).toBe(true);
    });
  });

  test("is true when the file has no extensions", async () => {
    await withTempFiles(
      { [APP_CONFIG_FILE]: "name: app\n" },
      async (tempDir) => {
        expect(await isExtensionPointsOrdered(tempDir)).toBe(true);
      },
    );
  });

  test("is true for the required order", async () => {
    await withTempFiles(
      makeAppConfigFile(ORDERED_EXTENSION_POINTS),
      async (tempDir) => {
        expect(await isExtensionPointsOrdered(tempDir)).toBe(true);
      },
    );
  });

  test("is false for another order and does not modify the file", async () => {
    const files = makeAppConfigFile([...ORDERED_EXTENSION_POINTS].reverse());
    await withTempFiles(files, async (tempDir) => {
      expect(await isExtensionPointsOrdered(tempDir)).toBe(false);
      expect(await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8")).toBe(
        files[APP_CONFIG_FILE],
      );
    });
  });
});

describe("ensureExtensionPointsOrder", () => {
  test("does not create a missing file", async () => {
    await withTempFiles({}, async (tempDir) => {
      expect(await ensureExtensionPointsOrder(tempDir)).toBe(false);
      expect(existsSync(join(tempDir, APP_CONFIG_FILE))).toBe(false);
    });
  });

  test("does not write when already ordered", async () => {
    await withTempFiles(
      makeAppConfigFile(ORDERED_EXTENSION_POINTS),
      async (tempDir) => {
        const path = join(tempDir, APP_CONFIG_FILE);
        const before = await stat(path);

        expect(await ensureExtensionPointsOrder(tempDir)).toBe(false);
        expect((await stat(path)).mtimeMs).toBe(before.mtimeMs);
      },
    );
  });

  test("reorders a shuffled file", async () => {
    await withTempFiles(
      makeAppConfigFile([
        EXTENSIBILITY_EXTENSION_POINT_ID,
        BACKEND_UI_V2_EXTENSION_POINT_ID,
        CONFIGURATION_EXTENSION_POINT_ID,
      ]),
      async (tempDir) => {
        expect(await ensureExtensionPointsOrder(tempDir)).toBe(true);
        expect(await readIds(tempDir)).toEqual(ORDERED_EXTENSION_POINTS);
      },
    );
  });

  test("keeps comments and blank lines with their extension point", async () => {
    await withTempFiles(WITH_COMMENTS, async (tempDir) => {
      await ensureExtensionPointsOrder(tempDir);

      const content = await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8");
      expect(content).toContain("name: app");
      expect(content).toContain("# config comment");
      expect(content).toMatch(UI_COMMENT_RE);
      expect(content).toMatch(EXT_COMMENT_RE);
    });
  });

  test("produces the expected output, keeping the spacing between entries", async () => {
    await withTempFiles(WITH_COMMENTS, async (tempDir) => {
      await ensureExtensionPointsOrder(tempDir);

      expect(
        await readFile(join(tempDir, APP_CONFIG_FILE), "utf-8"),
      ).toBe(`name: app

extensions:
  # ui comment
  commerce/backend-ui/2:
    $include: src/commerce-backend-ui-2/ext.config.yaml

  # config comment
  commerce/configuration/1:
    $include: src/commerce-configuration-1/ext.config.yaml

  # ext comment
  commerce/extensibility/1:
    $include: src/commerce-extensibility-1/ext.config.yaml
`);
    });
  });

  test("puts unknown ids last in their original order without throwing", async () => {
    await withTempFiles(
      makeAppConfigFile([
        "other/b/1",
        EXTENSIBILITY_EXTENSION_POINT_ID,
        "other/a/1",
        BACKEND_UI_V2_EXTENSION_POINT_ID,
      ]),
      async (tempDir) => {
        await ensureExtensionPointsOrder(tempDir);
        expect(await readIds(tempDir)).toEqual([
          BACKEND_UI_V2_EXTENSION_POINT_ID,
          EXTENSIBILITY_EXTENSION_POINT_ID,
          "other/b/1",
          "other/a/1",
        ]);
      },
    );
  });
});
