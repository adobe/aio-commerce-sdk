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

import Runtime, { init } from "@adobe/exc-app";
import page from "@adobe/exc-app/page";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createExtensionRouter, getRouteTo } from "#web/react/routing/lib";
import {
  createMockRuntime,
  loadExperienceCloudRuntime,
} from "#web/runtime-loader";

import { Entrypoint } from "./entrypoint";

import type { RuntimeConfiguration } from "@adobe/exc-app";
import type { ReactNode } from "react";
import type { ExtensionRoute } from "#web/react/routing/types";

/** Configuration options when instantiating an extension app. */
export type CreateExtensionAppOptions = {
  /** General metadata about the extension app. */
  metadata: {
    /** The unique identifier for the extension app. */
    extensionId: string;
  };

  /** The optional app page opened from the Commerce Admin menu and by default in Experience Cloud Shell. */
  menu?: ReactNode;

  /** Optional root element where the app will be mounted. */
  root?: HTMLElement;

  /** Additional path-based routes for the extension app. */
  routes?: ExtensionRoute[];
};

/**
 * Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX
 * registration, shared-context attachment, routing, and Spectrum setup.
 *
 * The app is wrapped in React's `<StrictMode>`, so in development builds (e.g. when
 * served via `aio app dev` or `aio app run`) components render twice and effects run
 * an extra setup + cleanup cycle on mount. Production builds are unaffected.
 *
 * @param options - App bootstrap options.
 *
 * @example
 * ```tsx
 * import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
 * import { MainPage } from "./pages/main-page.jsx";
 *
 * createExtensionApp({
 *   metadata: { extensionId: "my-extension-id" },
 *   menu: <MainPage />,
 * });
 * ```
 */
export function createExtensionApp({
  menu,
  metadata,
  routes = [],
  root: customRoot,
}: CreateExtensionAppOptions) {
  if (
    menu !== undefined &&
    routes.some((route) => getRouteTo(route.path) === "/")
  ) {
    throw new Error(
      'The "/" route is reserved for the menu. Pass its element through the menu option instead.',
    );
  }

  const rootElement = customRoot ?? document.getElementById("root");
  if (!rootElement) {
    throw new Error('Could not find an element with id "root".');
  }

  const root = createRoot(rootElement);
  const render = (
    runtime: ReturnType<typeof Runtime>,
    initialConfigurationPromise: Promise<RuntimeConfiguration | null> | null,
  ) => {
    const entrypointProps = {
      extensionId: metadata.extensionId,
      initialConfigurationPromise,
      runtime,
    };

    const entrypoint = <Entrypoint {...entrypointProps} />;
    const router = createExtensionRouter(
      entrypoint,
      menu === undefined ? routes : [{ element: menu, path: "/" }, ...routes],
    );

    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  };

  try {
    loadExperienceCloudRuntime();
    init(() => {
      const runtime = Runtime();
      const { promise, resolve } =
        Promise.withResolvers<RuntimeConfiguration | null>();

      page.title = document.title;
      runtime.on("ready", (configuration?: RuntimeConfiguration) => {
        resolve(configuration ?? runtime.lastConfigurationPayload);
        page.done().catch(() => {
          console.warn(
            "Failed to mark page as done in Experience Cloud Shell.",
          );
        });
      });

      // Render immediately instead of waiting for "ready", so the app can show its own
      // loading UI (via Suspense) rather than leaving the iframe blank until the shell responds.
      render(runtime, promise);
    });
  } catch {
    // Nothing to wait for here (no shell, no host), so skip the promise/Suspense
    // machinery entirely instead of forcing an always-resolved promise through it.
    render(createMockRuntime(), null);
  }
}
