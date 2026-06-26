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

// Applies the Spectrum base theme to the `<html>` element via plain CSS so the
// iframe is themed on first paint, before this bundle mounts the Provider.
import "@react-spectrum/s2/page.css";

import Runtime, { init } from "@adobe/exc-app";
import page from "@adobe/exc-app/page";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import { createExtensionRouter } from "#web/react/routing/lib";
import {
  createMockRuntime,
  loadExperienceCloudRuntime,
} from "#web/runtime-loader";

import { ExtensionApp } from "./extension-app";

import type { RuntimeConfiguration } from "@adobe/exc-app";
import type { ExtensionAppRoutes } from "#web/react/routing/types";

/** Configuration options when instantiating an extension app. */
export type CreateExtensionAppOptions = {
  /** General metadata about the extension app. */
  metadata: {
    /** The unique identifier for the extension app. */
    extensionId: string;

    /** The display title for the extension app. */
    title?: string;
  };

  /** Optional root element where the app will be mounted. */
  root?: HTMLElement;

  /** A list of routes for the extension app, specifying an index route is mandatory. */
  routes: ExtensionAppRoutes;
};

/**
 * Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX
 * registration, shared-context attachment, routing, and Spectrum setup.
 *
 * @param options - App bootstrap options.
 */
export function createExtensionApp({
  metadata,
  routes,
  root: customRoot,
}: CreateExtensionAppOptions) {
  const rootElement = customRoot ?? document.getElementById("root");
  if (!rootElement) {
    throw new Error('Could not find an element with id "root".');
  }

  const root = createRoot(rootElement);
  const render = (
    runtime: ReturnType<typeof Runtime>,
    initialConfiguration: RuntimeConfiguration | null,
  ) => {
    const extensionAppProps = {
      extensionId: metadata.extensionId,
      initialConfiguration,
      runtime,
    };

    const extension = <ExtensionApp {...extensionAppProps} />;
    const router = createExtensionRouter(extension, routes);

    root.render(<RouterProvider router={router} />);
  };

  try {
    loadExperienceCloudRuntime();
    init(() => {
      const runtime = Runtime();
      page.title = metadata.title ?? `App Extension (${metadata.extensionId})`;

      runtime.on("ready", (configuration?: RuntimeConfiguration) => {
        render(runtime, configuration ?? runtime.lastConfigurationPayload);
        page.done().catch(() => {
          console.warn(
            "Failed to mark page as done in Experience Cloud Shell.",
          );
        });
      });
    });
  } catch {
    render(createMockRuntime(), null);
    document.title =
      metadata.title ?? `App Extension (${metadata.extensionId})`;
  }
}
