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

import { Provider } from "@react-spectrum/s2/Provider";
import { Outlet } from "@tanstack/react-router";

import { useSpectrumRouter } from "./routing/hooks/use-spectrum-router";
import { ExtensionErrorBoundary } from "./runtime/extension-error-boundary";
import { useShellConfiguration } from "./runtime/hooks/use-shell-configuration";
import { SharedContextProvider } from "./shared-context";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";
import type { NavigateOptions, ToOptions } from "@tanstack/react-router";

declare module "@react-spectrum/s2/Provider" {
  interface RouterConfig {
    href: ToOptions;
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

/** The props received by the {@link ExtensionApp} component. */
type ExtensionAppProps = {
  extensionId: string;
  initialConfiguration: RuntimeConfiguration | null;
  runtime: Runtime;
};

/**
 * The ExtensionApp component is the main entry point for an extension app. It is responsible for rendering the app and providing the necessary context to it.
 * @param props - The props needed to initialize the extension app.
 */
export function ExtensionApp(props: Readonly<ExtensionAppProps>) {
  const { extensionId, initialConfiguration, runtime } = props;

  const spectrumRouter = useSpectrumRouter();
  const shellConfiguration = useShellConfiguration(
    runtime,
    initialConfiguration,
  );

  return (
    <ExtensionErrorBoundary>
      <Provider background="base" router={spectrumRouter}>
        <SharedContextProvider
          extensionId={extensionId}
          shellConfiguration={shellConfiguration}>
          <Outlet />
        </SharedContextProvider>
      </Provider>
    </ExtensionErrorBoundary>
  );
}
