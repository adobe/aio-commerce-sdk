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

import type { NavigateOptions, ToOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";

declare module "@react-spectrum/s2/Provider" {
  interface RouterConfig {
    href: ToOptions;
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

/** Defines a route that is marked as the index (entrypoint) */
export type IndexRoute = {
  index: true;

  /** The React element to render for the index route. */
  element: ReactNode;
};

/** Defines a route that exists at a given path. */
export type ExtensionRoute = {
  /** The path for the route. */
  path: string;

  /** The React element to render for the route. */
  element: ReactNode;
};

/** Defines a route entry, which can be either an index route or a path-based route. */
export type RouteEntry = IndexRoute | ExtensionRoute;

/** Defines the routes for an extension app, which must include at least one index route (first item). */
export type ExtensionAppRoutes = [IndexRoute, ...ExtensionRoute[]];
