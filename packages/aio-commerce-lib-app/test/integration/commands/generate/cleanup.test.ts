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
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { consola } from "consola";
import { afterEach, describe, expect, test, vi } from "vitest";
import { parse } from "yaml";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  CONFIGURATION_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
  INSTALL_YAML_FILE,
} from "#commands/constants";
import { run as generateActions } from "#commands/generate/actions/main";
import { run as generateSchema } from "#commands/generate/schema/main";
import { run as postinstall } from "#commands/hooks/postinstall";
import { getExtConfigPath } from "#commands/utils";
import { makeTemplateFiles } from "#test/fixtures/commands";
import {
  configWithAdminUiMenu,
  configWithBusinessConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  businessConfigActionFile,
  EMPTY_PROJECT,
  extensibilityActionFile,
  generatedSchemaFile,
  withTempProject,
} from "#test/fixtures/project";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

vi.mock("node:child_process", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:child_process")>();
  const { createSpawnSyncStub } = await import("#test/fixtures/exec");

  return {
    ...original,
    spawnSync: createSpawnSyncStub(original.spawnSync, ["esbuild"]),
  };
});

const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => undefined);
const infoSpy = vi.spyOn(consola, "info").mockImplementation(() => undefined);

const PROJECT = { ...EMPTY_PROJECT, ...makeTemplateFiles() };
const CONFIGURATION_DIR = getExtensionPointFolderPath(
  CONFIGURATION_EXTENSION_POINT_ID,
);

const BACKEND_UI_DIR = getExtensionPointFolderPath(
  BACKEND_UI_V2_EXTENSION_POINT_ID,
);

const EXTENSIBILITY_DIR = getExtensionPointFolderPath(
  EXTENSIBILITY_EXTENSION_POINT_ID,
);

const KEPT_EXT_CONFIG_RE = /has changes that lib-app did not generate/u;
const BACKEND_UI_KEPT_RE = /web-src files .* were kept/u;

/** Runs the same steps `generate all` does, against the temp project. */
async function generate(config: CommerceAppConfigOutputModel, tempDir: string) {
  await generateActions(config, tempDir, tempDir);
  await generateSchema(config, tempDir);
}

async function readYaml(tempDir: string, file: string) {
  return parse(await readFile(join(tempDir, file), "utf-8"));
}

async function listedExtensionPoints(tempDir: string) {
  const [appConfig, installYaml] = await Promise.all([
    readYaml(tempDir, APP_CONFIG_FILE),
    readYaml(tempDir, INSTALL_YAML_FILE),
  ]);

  return {
    appConfig: Object.keys(appConfig.extensions),
    install: installYaml.extensions.map(
      (entry: { extensionPointId: string }) => entry.extensionPointId,
    ),
  };
}

function removedLogs() {
  return infoSpy.mock.calls.filter(([message]) =>
    String(message).startsWith("Removed"),
  );
}

describe("commands/generate/actions cleanup of removed extensions", () => {
  afterEach(() => {
    warnSpy.mockClear();
    infoSpy.mockClear();
  });

  test("removes generated files, folders and entries when businessConfig is removed, and is idempotent", async () => {
    await withTempProject(PROJECT, async (tempDir) => {
      await generate(configWithBusinessConfig, tempDir);

      const userFile = join(tempDir, EXTENSIBILITY_DIR, "notes.md");
      await writeFile(userFile, "mine");
      await writeFile(join(tempDir, ".env"), "KEEP=1\n", { flag: "a" });

      expect(existsSync(businessConfigActionFile(tempDir, "config"))).toBe(
        true,
      );
      expect(existsSync(generatedSchemaFile(tempDir))).toBe(true);
      expect(await listedExtensionPoints(tempDir)).toEqual({
        appConfig: [
          CONFIGURATION_EXTENSION_POINT_ID,
          EXTENSIBILITY_EXTENSION_POINT_ID,
        ],
        install: expect.arrayContaining([CONFIGURATION_EXTENSION_POINT_ID]),
      });

      await generate(minimalValidConfig, tempDir);

      expect(existsSync(join(tempDir, CONFIGURATION_DIR))).toBe(false);
      expect(await listedExtensionPoints(tempDir)).toEqual({
        appConfig: [EXTENSIBILITY_EXTENSION_POINT_ID],
        install: [EXTENSIBILITY_EXTENSION_POINT_ID],
      });

      expect(existsSync(extensibilityActionFile(tempDir, "app-config"))).toBe(
        true,
      );
      expect(
        existsSync(
          join(tempDir, getExtConfigPath(EXTENSIBILITY_EXTENSION_POINT_ID)),
        ),
      ).toBe(true);
      expect(await readFile(userFile, "utf-8")).toBe("mine");
      expect(await readFile(join(tempDir, ".env"), "utf-8")).toContain(
        "KEEP=1",
      );
      expect(warnSpy).not.toHaveBeenCalled();

      const snapshot = await Promise.all(
        [APP_CONFIG_FILE, INSTALL_YAML_FILE].map((file) =>
          readFile(join(tempDir, file), "utf-8"),
        ),
      );

      infoSpy.mockClear();
      await generate(minimalValidConfig, tempDir);

      const after = await Promise.all(
        [APP_CONFIG_FILE, INSTALL_YAML_FILE].map((file) =>
          readFile(join(tempDir, file), "utf-8"),
        ),
      );

      expect(after).toEqual(snapshot);
      expect(removedLogs()).toHaveLength(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  test("keeps a modified ext.config.yaml with its entries and warns, but removes generated files", async () => {
    await withTempProject(PROJECT, async (tempDir) => {
      await generate(configWithBusinessConfig, tempDir);

      const extConfigPath = join(
        tempDir,
        getExtConfigPath(CONFIGURATION_EXTENSION_POINT_ID),
      );

      await appendFile(extConfigPath, "\nmyCustomKey: true\n");
      await generate(minimalValidConfig, tempDir);

      expect(await readFile(extConfigPath, "utf-8")).toContain("myCustomKey");
      expect(await listedExtensionPoints(tempDir)).toEqual({
        appConfig: [
          CONFIGURATION_EXTENSION_POINT_ID,
          EXTENSIBILITY_EXTENSION_POINT_ID,
        ],
        install: expect.arrayContaining([CONFIGURATION_EXTENSION_POINT_ID]),
      });

      expect(existsSync(businessConfigActionFile(tempDir, "config"))).toBe(
        false,
      );
      expect(existsSync(generatedSchemaFile(tempDir))).toBe(false);
      expect(existsSync(join(tempDir, CONFIGURATION_DIR, ".generated"))).toBe(
        false,
      );

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(KEPT_EXT_CONFIG_RE),
      );
    });
  });

  test("keeps folders that hold a user file but still removes the generated ext.config.yaml and entries", async () => {
    await withTempProject(PROJECT, async (tempDir) => {
      await generate(configWithBusinessConfig, tempDir);

      const userFile = join(
        dirname(businessConfigActionFile(tempDir, "config")),
        "my-action.js",
      );

      await mkdir(dirname(userFile), { recursive: true });
      await writeFile(userFile, "// mine");
      await generate(minimalValidConfig, tempDir);

      expect(await readFile(userFile, "utf-8")).toBe("// mine");
      expect(existsSync(businessConfigActionFile(tempDir, "config"))).toBe(
        false,
      );
      expect(existsSync(businessConfigActionFile(tempDir, "scope-tree"))).toBe(
        false,
      );
      expect(existsSync(generatedSchemaFile(tempDir))).toBe(false);
      expect(
        existsSync(
          join(tempDir, getExtConfigPath(CONFIGURATION_EXTENSION_POINT_ID)),
        ),
      ).toBe(false);
      expect(await listedExtensionPoints(tempDir)).toEqual({
        appConfig: [EXTENSIBILITY_EXTENSION_POINT_ID],
        install: [EXTENSIBILITY_EXTENSION_POINT_ID],
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  test("removes only the entries for backend-ui/2 and keeps its user files and ext.config.yaml with a warning", async () => {
    await withTempProject(PROJECT, async (tempDir) => {
      await generate(configWithAdminUiMenu, tempDir);

      expect((await listedExtensionPoints(tempDir)).appConfig).toContain(
        BACKEND_UI_V2_EXTENSION_POINT_ID,
      );
      expect(existsSync(join(tempDir, BACKEND_UI_DIR, "web-src"))).toBe(true);

      await generate(minimalValidConfig, tempDir);

      expect(await listedExtensionPoints(tempDir)).toEqual({
        appConfig: [EXTENSIBILITY_EXTENSION_POINT_ID],
        install: [EXTENSIBILITY_EXTENSION_POINT_ID],
      });
      expect(existsSync(join(tempDir, BACKEND_UI_DIR, "web-src"))).toBe(true);
      expect(
        existsSync(
          join(tempDir, getExtConfigPath(BACKEND_UI_V2_EXTENSION_POINT_ID)),
        ),
      ).toBe(true);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(BACKEND_UI_KEPT_RE),
      );
    });
  });

  test("the postinstall hook also cleans up when a domain was removed", async () => {
    await withTempProject(PROJECT, async (tempDir) => {
      await generate(configWithBusinessConfig, tempDir);
      await postinstall(minimalValidConfig, tempDir, tempDir);

      expect(existsSync(join(tempDir, CONFIGURATION_DIR))).toBe(false);
      expect((await listedExtensionPoints(tempDir)).appConfig).toEqual([
        EXTENSIBILITY_EXTENSION_POINT_ID,
      ]);
    });
  });
});
