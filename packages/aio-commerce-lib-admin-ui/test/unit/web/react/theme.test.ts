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

import { afterEach, describe, expect, test } from "vitest";

import { getShellColorScheme, syncRootColorScheme } from "#web/react/theme";

describe("getShellColorScheme", () => {
  test.each([
    ["dark", "dark"],
    ["spectrum--darkest", "dark"],
    ["light", "light"],
    ["spectrum--lightest", "light"],
    ["unknown", undefined],
    [null, undefined],
    [undefined, undefined],
  ] as const)("maps %j to %j", (theme, expected) => {
    expect(getShellColorScheme(theme)).toBe(expected);
  });
});

describe("syncRootColorScheme", () => {
  afterEach(() => {
    delete document.documentElement.dataset.colorScheme;
  });

  test("sets the root color scheme attribute", () => {
    syncRootColorScheme("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
  });

  test("removes the root color scheme attribute when undefined", () => {
    syncRootColorScheme("light");
    syncRootColorScheme(undefined);

    expect(document.documentElement.dataset.colorScheme).toBeUndefined();
    expect(document.documentElement.hasAttribute("data-color-scheme")).toBe(
      false,
    );
  });
});
