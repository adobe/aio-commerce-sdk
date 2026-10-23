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

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  CONFIGURATION_EXTENSION_POINT_ID as CONFIG,
  EXTENSIBILITY_EXTENSION_POINT_ID as EXT,
  BACKEND_UI_V2_EXTENSION_POINT_ID as UI,
} from "#commands/constants";
import {
  addExtensionPointToInstallYaml,
  getExtensionPointInsertIndex,
} from "#commands/init/utils";

const ID_RE = /extensionPointId: (\S+)/g;

const ALL = [UI, CONFIG, EXT];

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) {
    return [items];
  }

  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

describe("install.yaml extension point order", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "install-yaml-"));
    await writeFile(join(dir, "install.yaml"), "name: app\n");
  });

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true });
  });

  async function addAll(ids: string[]) {
    await ids.reduce(
      (previous, id) =>
        previous.then(() =>
          addExtensionPointToInstallYaml(id, dir, " comment"),
        ),
      Promise.resolve(),
    );
  }

  async function readIds() {
    const content = await readFile(join(dir, "install.yaml"), "utf-8");
    return [...content.matchAll(ID_RE)].map((match) => match[1]);
  }

  test("getExtensionPointInsertIndex places each id by rank", () => {
    expect(getExtensionPointInsertIndex([], EXT)).toBe(0);
    expect(getExtensionPointInsertIndex([EXT], UI)).toBe(0);
    expect(getExtensionPointInsertIndex([UI, EXT], CONFIG)).toBe(1);
    expect(getExtensionPointInsertIndex([UI, CONFIG], EXT)).toBe(2);
  });

  test("emits the full set as backend ui, configuration, extensibility", async () => {
    await addAll(ALL);

    expect(await readIds()).toEqual(ALL);
  });

  for (const order of permutations(ALL)) {
    test(`orders the full set when added as ${order.join(", ")}`, async () => {
      await addAll(order);

      expect(await readIds()).toEqual(ALL);
    });
  }

  for (const subset of [
    [UI, CONFIG],
    [UI, EXT],
    [CONFIG, EXT],
    [UI],
    [CONFIG],
    [EXT],
  ]) {
    for (const order of permutations(subset)) {
      test(`keeps relative order for subset added as ${order.join(", ")}`, async () => {
        await addAll(order);

        expect(await readIds()).toEqual(subset);
      });
    }
  }

  test("does not duplicate an existing extension point", async () => {
    await addExtensionPointToInstallYaml(EXT, dir, " comment");
    await addExtensionPointToInstallYaml(EXT, dir, " comment");

    expect(await readIds()).toEqual([EXT]);
  });
});
