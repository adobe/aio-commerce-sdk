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

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "vitest-browser-react";

import type { AnyRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** A child route to mount inside the component under test's `<Outlet />`. */
type RouteSpec = { index?: boolean; path?: string; element: ReactNode };

type RouterOptions = {
  /** Child routes rendered into the root component's `<Outlet />`. */
  routes?: RouteSpec[];
  /** Initial history stack; seed multiple entries to make `useCanGoBack` true. */
  initialEntries?: string[];
};

/**
 * Builds a real TanStack router backed by memory history, so tests get deterministic,
 * isolated navigation. A catch-all splat route is always added so navigating to
 * arbitrary paths matches without pre-declaring every route.
 */
function buildRouter(
  rootComponent: () => ReactNode,
  routes: RouteSpec[],
  initialEntries: string[],
): AnyRouter {
  const rootRoute = createRootRoute({ component: rootComponent });

  const specs = routes.some((route) => route.index)
    ? routes
    : [{ index: true, element: null } as RouteSpec, ...routes];

  const children = specs.map((route) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: route.index ? "/" : (route.path as string),
      component: () => route.element,
    }),
  );

  const splat = createRoute({
    getParentRoute: () => rootRoute,
    path: "$",
    component: () => null,
  });

  return createRouter({
    history: createMemoryHistory({ initialEntries }),
    routeTree: rootRoute.addChildren([...children, splat]),
  });
}

/**
 * Renders `ui` as the root route of a real router. Use when the component under test
 * needs router context (e.g. `useSpectrumRouter`) or renders an `<Outlet />`.
 *
 * @param ui - The element under test.
 * @param options - Child routes and/or initial history entries.
 * @returns The rendered screen and the live router (assert on `router.state`).
 */
export async function renderWithRouter(
  ui: ReactNode,
  options: RouterOptions = {},
) {
  const { routes = [], initialEntries = ["/"] } = options;
  const router = buildRouter(() => ui, routes, initialEntries);
  const screen = await render(<RouterProvider router={router} />);
  return { screen, router };
}

/**
 * Renders a hook inside a real router context and exposes its latest return value.
 * Read `result.current` (after `vi.waitFor` when the value updates asynchronously).
 *
 * @param useHook - The hook invocation under test.
 * @param options - Initial history entries.
 * @returns `result` (live hook value), the router, and the rendered screen.
 */
export async function renderHookWithRouter<T>(
  useHook: () => T,
  options: Pick<RouterOptions, "initialEntries"> = {},
) {
  const { initialEntries = ["/"] } = options;
  const result = { current: undefined as T };

  function Probe() {
    result.current = useHook();
    return null;
  }

  const router = buildRouter(() => <Probe />, [], initialEntries);
  const screen = await render(<RouterProvider router={router} />);
  return { result, router, screen };
}
