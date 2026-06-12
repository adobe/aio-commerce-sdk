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

import { describe, expect, test } from "vitest";

import * as paths from "#menu/paths";

const menuConstants = Object.entries(paths)
  .filter(([key, val]) => key.startsWith("MENU_") && typeof val === "string")
  .map(([, val]) => val as string);

describe("COMMERCE_MENUS", () => {
  test("contains every named MENU_ constant", () => {
    for (const id of menuConstants) {
      expect(
        paths.isCommerceMenu(id),
        `COMMERCE_MENUS should contain "${id}"`,
      ).toBe(true);
    }
  });
});

describe("isCommerceMenu", () => {
  test("returns true for every value in COMMERCE_MENUS", () => {
    for (const id of paths.COMMERCE_MENUS) {
      expect(paths.isCommerceMenu(id), `"${id}" should be a known menu`).toBe(
        true,
      );
    }
  });

  test("returns false for an unknown menu ID", () => {
    expect(paths.isCommerceMenu("unknown::menu")).toBe(false);
  });

  test("returns false for an empty string", () => {
    expect(paths.isCommerceMenu("")).toBe(false);
  });
});
