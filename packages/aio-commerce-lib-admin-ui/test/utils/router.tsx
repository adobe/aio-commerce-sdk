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

import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render } from "vitest-browser-react";

import { createExtensionRouter } from "#web/react/routing/lib";

import type { ExtensionRoute } from "#web/react/routing/types";

type RouterOptions = {
  /** Routes rendered into the root component's `<Outlet />`; declare every path a test navigates to. */
  routes?: ExtensionRoute[];
  /** Initial history stack; seed multiple entries to make `useCanGoBack` true. */
  initialEntries?: string[];
};

/**
 * Renders `ui` as the root route of the real extension router, backed by memory history so tests
 * get deterministic, seedable, isolated navigation. Use when the component under test needs router
 * context (e.g. `useSpectrumRouter`) or renders an `<Outlet />`.
 *
 * @param ui - The element under test.
 * @param options - Child routes and/or initial history entries.
 * @returns The rendered screen and the live router (assert on `router.state`).
 */
export async function renderWithRouter(
  ui: React.JSX.Element,
  options: RouterOptions = {},
) {
  const { routes = [], initialEntries = ["/"] } = options;
  const router = createExtensionRouter(
    ui,
    routes,
    createMemoryHistory({ initialEntries }),
  );
  const screen = await render(<RouterProvider router={router} />);
  return { router, screen };
}

/**
 * Renders a hook inside the real router context and exposes its latest return value.
 * Read `result.current` (after `vi.waitFor` when the value updates asynchronously).
 *
 * @param useHook - The hook invocation under test.
 * @param options - Child routes and/or initial history entries.
 * @returns `result` (live hook value), the router, and the rendered screen.
 */
export async function renderHookWithRouter<T>(
  useHook: () => T,
  options: RouterOptions = {},
) {
  const { routes = [], initialEntries = ["/"] } = options;
  const result = { current: undefined as T };

  function Probe() {
    result.current = useHook();
    return null;
  }

  const router = createExtensionRouter(
    <Probe />,
    routes,
    createMemoryHistory({ initialEntries }),
  );
  const screen = await render(<RouterProvider router={router} />);
  return { result, router, screen };
}
