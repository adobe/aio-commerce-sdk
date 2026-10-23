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

import { describe, expect, test, vi } from "vitest";

const { actionsMock, manifestMock, schemaMock, orderMock } = vi.hoisted(() => ({
  actionsMock: vi.fn(),
  manifestMock: vi.fn(),
  orderMock: vi.fn(),
  schemaMock: vi.fn(),
}));

vi.mock("#commands/generate/actions/main", () => ({ run: actionsMock }));
vi.mock("#commands/generate/manifest/main", () => ({ run: manifestMock }));
vi.mock("#commands/generate/schema/main", () => ({ run: schemaMock }));
vi.mock("#commands/install-yaml", () => ({
  ensureExtensionPointsOrder: orderMock,
}));

import { run } from "#commands/hooks/postinstall";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("commands/hooks/postinstall", () => {
  test("runs the generators and fixes the install.yaml extension order", async () => {
    await run({} as CommerceAppConfigOutputModel, "/tmp/project");

    expect(actionsMock).toHaveBeenCalledOnce();
    expect(manifestMock).toHaveBeenCalledOnce();
    expect(schemaMock).toHaveBeenCalledOnce();
    expect(orderMock).toHaveBeenCalledWith("/tmp/project");
  });
});
