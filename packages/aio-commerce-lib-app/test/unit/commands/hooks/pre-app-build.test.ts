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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { loadAppManifestMock, prepareMock } = vi.hoisted(() => ({
  loadAppManifestMock: vi.fn(),
  prepareMock: vi.fn(),
}));

vi.mock("#commands/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#commands/utils")>()),
  loadAppManifest: loadAppManifestMock,
}));

vi.mock("#commands/generate/actions/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#commands/generate/actions/lib")>()),
  prepareRuntimeAppConfigModule: prepareMock,
}));

import { run } from "#commands/hooks/pre-app-build";

const ORDER_ERROR_RE =
  /were reordered \(commerce\/backend-ui\/2, commerce\/configuration\/1, commerce\/extensibility\/1\).*run the build again/s;

const WRONG = `extensions:
  - extensionPointId: commerce/extensibility/1
  - extensionPointId: commerce/backend-ui/2
`;

const RIGHT = `extensions:
  - extensionPointId: commerce/backend-ui/2
  - extensionPointId: commerce/extensibility/1
`;

describe("commands/hooks/pre-app-build extension order", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "pre-app-build-"));
    loadAppManifestMock.mockResolvedValue({ metadata: {} });
    prepareMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await rm(dir, { force: true, recursive: true });
  });

  test("rewrites a wrong order and fails asking for a new build", async () => {
    await writeFile(join(dir, "install.yaml"), WRONG);

    await expect(run("backend-ui/2", dir)).rejects.toThrow(ORDER_ERROR_RE);
    expect(await readFile(join(dir, "install.yaml"), "utf-8")).toBe(RIGHT);
    expect(loadAppManifestMock).not.toHaveBeenCalled();
  });

  test("a second invocation after the rewrite passes", async () => {
    await writeFile(join(dir, "install.yaml"), WRONG);
    await expect(run("backend-ui/2", dir)).rejects.toThrow();

    await expect(run("extensibility/1", dir)).resolves.not.toThrow();
  });

  test("passes when the order is right", async () => {
    await writeFile(join(dir, "install.yaml"), RIGHT);

    await expect(run("backend-ui/2", dir)).resolves.toBeUndefined();
    expect(await readFile(join(dir, "install.yaml"), "utf-8")).toBe(RIGHT);
  });

  test("passes when install.yaml does not exist", async () => {
    await expect(run("backend-ui/2", dir)).resolves.toBeUndefined();
  });
});
