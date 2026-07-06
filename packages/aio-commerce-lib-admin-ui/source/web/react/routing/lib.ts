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
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import type { IndexRoute, RouteEntry } from "./types";

const HASH_ROUTE_PREFIX_PATTERN = /^[#/]+/u;

/**
 * Determines if a given route is an index route.
 * @param route The route to check.
 */
function isIndexRoute(route: RouteEntry): route is IndexRoute {
  return "index" in route && route.index;
}

/**
 * Returns the path for a given route, removing any leading hash or slash characters.
 * @param route The route to get the path for.
 */
function getRoutePath(route: RouteEntry) {
  if (isIndexRoute(route)) {
    return "/";
  }

  return route.path.replace(HASH_ROUTE_PREFIX_PATTERN, "");
}

/**
 * Returns the "to" path for a given route, removing any leading hash or slash characters.
 * @param path The path to convert to a "to" path.
 */
export function getRouteTo(path: string) {
  const routePath = path.replace(HASH_ROUTE_PREFIX_PATTERN, "");
  return routePath ? `/${routePath}` : "/";
}

/**
 * Returns a router instance for an extension app, given the root component and route entries.
 *
 * @param rootComponent The root component of the extension app.
 * @param routeEntries The route entries for the extension app.
 */
export function createExtensionRouter(
  rootComponent: React.JSX.Element,
  routeEntries: RouteEntry[],
) {
  const rootRoute = createRootRoute({
    component: () => rootComponent,
  });

  const routes = routeEntries.map((route) =>
    createRoute({
      component: () => route.element,

      getParentRoute: () => rootRoute,
      path: getRoutePath(route),
    }),
  );

  return createRouter({
    history: createHashHistory(),
    routeTree: rootRoute.addChildren(routes),
  });
}
