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

import { Outlet as ActiveRoute, RouterProvider } from "@tanstack/react-router";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";

import { createExtensionRouter, getRouteTo } from "#web/react/routing/lib";

describe("getRouteTo", () => {
  test.each([
    ["#/foo", "/foo"],
    ["/foo", "/foo"],
    ["foo/bar", "/foo/bar"],
    ["", "/"],
    ["#/", "/"],
  ])("converts %j to %j", (path, expected) => {
    expect(getRouteTo(path)).toBe(expected);
  });
});

describe("createExtensionRouter", () => {
  test("builds a router with root and hash-stripped route paths", () => {
    const router = createExtensionRouter(<div />, [
      { element: <div>home</div>, path: "/" },
      { element: <div>settings</div>, path: "#/settings" },
    ]);

    const paths = Object.keys(router.routesByPath);
    expect(paths).toContain("/");
    expect(paths).toContain("/settings");
    expect(paths).not.toContain("/#/settings");
  });

  test("renders the root component and the matched route element", async () => {
    const router = createExtensionRouter(<ActiveRoute />, [
      { element: <div>home</div>, path: "/" },
    ]);

    const screen = await render(<RouterProvider router={router} />);
    await expect.element(screen.getByText("home")).toBeInTheDocument();
  });
});
