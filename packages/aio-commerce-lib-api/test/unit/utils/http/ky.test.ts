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

import ky from "ky";
import { describe, expect, test } from "vitest";

import { createKy, resolveKyDefaultExport } from "#utils/http/ky";

describe("utils/http/ky", () => {
  test("should resolve the direct Ky default export", () => {
    expect(resolveKyDefaultExport(ky)).toBe(ky);
  });

  test("should resolve a nested Ky default export", () => {
    const nestedKyExport = {
      default: ky,
    } as unknown as Parameters<typeof resolveKyDefaultExport>[0];

    expect(resolveKyDefaultExport(nestedKyExport)).toBe(ky);
  });

  test("should create a Ky instance", () => {
    const client = createKy({
      prefix: "https://example.com",
    });

    expect(client).not.toBe(ky);
    expect(client.create).toBeTypeOf("function");
  });
});
