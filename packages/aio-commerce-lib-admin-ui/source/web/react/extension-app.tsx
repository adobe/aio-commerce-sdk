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

import { ProgressCircle } from "@react-spectrum/s2/ProgressCircle";
import { Provider } from "@react-spectrum/s2/Provider";
import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import {
  resolveCommerceImsCredentials,
  resolveShellImsCredentials,
} from "#web/react/auth/lib";
import {
  SharedContextProvider,
  useSharedContext,
} from "#web/react/commerce/context/shared-context.tsx";
import { isUiFrame } from "#web/react/commerce/lib";
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

/** The fallback UI shown when connecting to the Commerce host. */
function ConnectionFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,

        // Subtract the padding to avoid generating overflow
        minHeight: "calc(100dvh - 48px)",
      }}>
      <ProgressCircle
        aria-label="Connecting to Commerce Admin"
        isIndeterminate
      />
    </div>
  );
}

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
 * This is a separated component because color scheme needs the `SharedContextProvider` to be
 * mounted first, so it can access the Commerce shared context.
 *
 * @param props - The Experience Cloud shell configuration, if available.
 */
function ExtensionAppContent(
  props: Readonly<{ shellConfiguration: ShellConfiguration | null }>,
) {
  const { shellConfiguration } = props;
  const spectrumRouter = useSpectrumRouter();

  const isCommerceLike = isUiFrame() && shellConfiguration === null;
  const colorScheme = useExtensionColorScheme(
    isCommerceLike,
    shellConfiguration,
  );

  return (
    // The Spectrum Provider sits at the top so the error boundary and its fallback
    // render within the configured theme, and so it wraps the data providers below.
    <Provider colorScheme={colorScheme} router={spectrumRouter}>
      <ExtensionErrorBoundary>
        {isCommerceLike ? (
          // All Commerce rendering needs to wait for the guest connection to resolve, so we suspend until then.
          <Suspense fallback={<ConnectionFallback />}>
            <CommerceExtensionContent />
          </Suspense>
        ) : (
          // Neither a Commerce UI frame nor a control frame: either the Experience Cloud shell,
          // or the raw HTML page running standalone with no host frame at all. Neither case has a
          // guest connection to wait on, so no Suspense is needed here.
          <NonCommerceExtensionContent
            shellConfiguration={shellConfiguration}
          />
        )}
      </ExtensionErrorBoundary>
    </Provider>
  );
}

/** Renders IMS-gated route content for a Commerce Admin UI frame. */
function CommerceExtensionContent() {
  // Suspended above until the guest connection is established, so `sharedContext` is guaranteed.
  const { sharedContext } = useSharedContext();
  const credentials = resolveCommerceImsCredentials(sharedContext);

  return (
    <ImsContextProvider credentials={credentials}>
      <Outlet />
    </ImsContextProvider>
  );
}

/**
 * Renders IMS-gated route content for the Experience Cloud shell, or for the raw HTML page
 * running standalone with no host frame at all.
 */
function NonCommerceExtensionContent(
  props: Readonly<{ shellConfiguration: ShellConfiguration | null }>,
) {
  const credentials = resolveShellImsCredentials(props.shellConfiguration);

  return (
    <ImsContextProvider credentials={credentials}>
      <Outlet />
    </ImsContextProvider>
  );
}
