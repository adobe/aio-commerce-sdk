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

import { stubControlFrame, stubFrame, stubUiFrame } from "#test/utils/frame";
import {
  isControlFrame,
  isEmbeddedInHost,
  isUiFrame,
  parseOrderId,
} from "#web/react/commerce/lib";

describe("parseOrderId", () => {
  test.each([
    ["https://host.test/?orderId=5", "5"],
    ["https://host.test/#/view?orderId=7", "7"],
    ["https://host.test/?orderId=5#/view?orderId=7", "5"],
    ["https://host.test/", null],
  ])("parses %j to %j", (href, expected) => {
    expect(parseOrderId(href)).toBe(expected);
  });
});

describe("frame detection", () => {
  let restoreFrame: () => void = () => undefined;
  afterEach(() => {
    restoreFrame();
  });

  test("detects a standalone window as not embedded, ignoring the name", () => {
    // Not embedded, yet carrying a uix-guest name: the name must be ignored.
    restoreFrame = stubFrame({ embedded: false, name: "uix-guest-1" });

    expect(isEmbeddedInHost()).toBe(false);
    expect(isUiFrame()).toBe(false);
    expect(isControlFrame()).toBe(false);
  });

  test("detects a UI frame when embedded with a uix-guest name", () => {
    restoreFrame = stubUiFrame();

    expect(isEmbeddedInHost()).toBe(true);
    expect(isUiFrame()).toBe(true);
    expect(isControlFrame()).toBe(false);
  });

  test("detects a control frame when embedded with an empty name", () => {
    restoreFrame = stubControlFrame();

    expect(isEmbeddedInHost()).toBe(true);
    expect(isUiFrame()).toBe(false);
    expect(isControlFrame()).toBe(true);
  });

  test("detects neither frame when embedded with an unrelated name", () => {
    restoreFrame = stubFrame({ embedded: true, name: "other" });

    expect(isEmbeddedInHost()).toBe(true);
    expect(isUiFrame()).toBe(false);
    expect(isControlFrame()).toBe(false);
  });
});
