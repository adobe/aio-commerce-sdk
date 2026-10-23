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

import {
  CONFIGURATION_EXTENSION_POINT_ID as CONFIG,
  EXTENSIBILITY_EXTENSION_POINT_ID as EXT,
  BACKEND_UI_V2_EXTENSION_POINT_ID as UI,
} from "#commands/constants";
import { getExtensionPointInsertIndex } from "#commands/init/utils";

describe("getExtensionPointInsertIndex", () => {
  test("inserts into an empty list at 0", () => {
    expect(getExtensionPointInsertIndex([], EXT)).toBe(0);
  });

  test("places each id before the first id that ranks higher", () => {
    expect(getExtensionPointInsertIndex([EXT], UI)).toBe(0);
    expect(getExtensionPointInsertIndex([UI, EXT], CONFIG)).toBe(1);
    expect(getExtensionPointInsertIndex([UI, CONFIG], EXT)).toBe(2);
  });

  test("keeps unknown ids after the known ones", () => {
    expect(getExtensionPointInsertIndex(["other/a/1"], EXT)).toBe(0);
    expect(getExtensionPointInsertIndex([UI, "other/a/1"], "other/b/1")).toBe(
      2,
    );
  });
});
