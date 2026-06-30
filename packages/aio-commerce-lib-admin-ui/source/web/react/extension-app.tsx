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

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import { resolveImsCredentials } from "#web/react/auth/lib";
import {
  SharedContextProvider,
  useInternalSharedContext,
} from "#web/react/commerce/context/shared-context.tsx";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";
import { useExtensionColorScheme } from "#web/react/shell/hooks/use-extension-color-scheme";
import { useShellConfiguration } from "#web/react/shell/hooks/use-shell-configuration";

import { ExtensionErrorBoundary } from "./extension-error-boundary";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";
import type { ShellConfiguration } from "#web/react/shell/types";

/** The props received by the {@link ExtensionApp} component. */
type ExtensionAppProps = {
  extensionId: string;
  initialConfiguration: RuntimeConfiguration | null;
  runtime: Runtime;
};

/**
 * The ExtensionApp component is the main entry point for an extension app.
 * It is responsible for rendering the app and providing the necessary context to it.
 *
 * @param props - The props needed to initialize the extension app.
 */
export function ExtensionApp(props: Readonly<ExtensionAppProps>) {
  const { extensionId, initialConfiguration, runtime } = props;

  // The Experience Cloud shell configuration is an Experience Cloud concern, kept separate
  // from the Commerce shared context. It feeds the IMS credentials and drives shell navigation.
  const shellConfiguration = useShellConfiguration(
    runtime,
    initialConfiguration,
  );

  return (
    <SharedContextProvider extensionId={extensionId}>
      <ExtensionAppContent shellConfiguration={shellConfiguration} />
    </SharedContextProvider>
  );
}

/**
 * Renders the extension UI after the Commerce shared context provider is mounted.
 *
 * This is a separated component because color-scheme and IMS credential resolution need the
 * `SharedContextProvider` to be mounted first, so they can access the Commerce shared context.
 *
 * @param props - The Experience Cloud shell configuration, if available.
 */
function ExtensionAppContent(
  props: Readonly<{ shellConfiguration: ShellConfiguration | null }>,
) {
  const { shellConfiguration } = props;
  const spectrumRouter = useSpectrumRouter();
  const colorScheme = useExtensionColorScheme(shellConfiguration);

  const { sharedContext } = useInternalSharedContext();
  const credentials = resolveImsCredentials(shellConfiguration, sharedContext);

  return (
    // The Spectrum Provider sits at the top so the error boundary and its fallback
    // render within the configured theme, and so it wraps the data providers below.
    <Provider colorScheme={colorScheme} router={spectrumRouter}>
      <ExtensionErrorBoundary>
        <ImsContextProvider credentials={credentials}>
          <Outlet />
        </ImsContextProvider>
      </ExtensionErrorBoundary>
    </Provider>
  );
}
