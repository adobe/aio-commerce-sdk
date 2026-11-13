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

import { createRequire } from "node:module";

import { describe, expect, test } from "vitest";

import pkg from "../../package.json" with { type: "json" };

describe("package.json exports", () => {
  test("resolves @adobe/aio-commerce-lib-config/package.json to this package", () => {
    const resolved = createRequire(import.meta.url)(
      "@adobe/aio-commerce-lib-config/package.json",
    ) as { name: string; version: string };

    expect(resolved).toMatchObject({ name: pkg.name, version: pkg.version });
  });

  test("keeps ./package.json in the published exports", () => {
    expect(pkg.publishConfig.exports).toHaveProperty("./package.json");
  });
});
