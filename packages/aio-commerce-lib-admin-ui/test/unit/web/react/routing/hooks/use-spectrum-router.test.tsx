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

import { renderHookWithRouter } from "#test/utils/router.tsx";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";

import type { RouteEntry } from "#web/react/routing/types";

const ROUTES: RouteEntry[] = [
  { element: null, index: true },
  { element: null, path: "settings" },
  { element: null, path: "bar" },
];

describe("useSpectrumRouter", () => {
  describe("navigate", () => {
    test("maps a string href through getRouteTo and navigates", async () => {
      const { result, router } = await renderHookWithRouter(
        () => useSpectrumRouter(),
        { routes: ROUTES },
      );

      // The leading hash is stripped by the real getRouteTo, proving strings are transformed.
      await result.current.navigate("#/settings");
      expect(router.state.location.pathname).toBe("/settings");
    });

    test("passes an object href through unchanged and navigates", async () => {
      const { result, router } = await renderHookWithRouter(
        () => useSpectrumRouter(),
        { routes: ROUTES },
      );

      await result.current.navigate({ to: "/bar" });
      expect(router.state.location.pathname).toBe("/bar");
    });
  });

  describe("useHref", () => {
    test("maps a string href through getRouteTo and returns the built href", async () => {
      const { result } = await renderHookWithRouter(() => useSpectrumRouter(), {
        routes: ROUTES,
      });

      expect(result.current.useHref("#/settings")).toBe("/settings");
    });

    test("passes an object href through unchanged and returns the built href", async () => {
      const { result } = await renderHookWithRouter(() => useSpectrumRouter(), {
        routes: ROUTES,
      });

      expect(result.current.useHref({ to: "/bar" })).toBe("/bar");
    });
  });
});
