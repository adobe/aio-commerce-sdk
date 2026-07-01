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
import { Suspense, use } from "react";

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import { resolveShellImsCredentials } from "#web/react/auth/lib";
import { CenteredProgress } from "#web/react/centered-progress.tsx";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";
import { useExtensionColorScheme } from "#web/react/shell/hooks/use-extension-color-scheme";
import { useShellConfiguration } from "#web/react/shell/hooks/use-shell-configuration";

import { ExtensionErrorBoundary } from "./error-boundary";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";

/** The fallback UI shown while waiting for the Experience Cloud shell to become ready. */
function ShellFallback() {
  return <CenteredProgress aria-label="Loading experience cloud runtime" />;
}

/**
 * Renders the Experience Cloud shell flow, waiting for the shell's runtime configuration.
 * @param props - The props needed to initialize the extension app.
 */
export function ExperienceShellExtensionApp(
  props: Readonly<{
    initialConfigurationPromise: Promise<RuntimeConfiguration | null>;
    runtime: Runtime;
  }>,
) {
  const { initialConfigurationPromise, runtime } = props;
  return (
    // The real color scheme isn't known until the shell configuration resolves below.
    <Provider colorScheme={undefined}>
      <Suspense fallback={<ShellFallback />}>
        <ShellExtensionContent
          initialConfigurationPromise={initialConfigurationPromise}
          runtime={runtime}
        />
      </Suspense>
    </Provider>
  );
}

/**
 * Renders IMS-gated route content once the shell/runtime configuration is known.
 * @param props - The props needed to initialize the extension app.
 */
function ShellExtensionContent(
  props: Readonly<{
    initialConfigurationPromise: Promise<RuntimeConfiguration | null>;
    runtime: Runtime;
  }>,
) {
  const { initialConfigurationPromise, runtime } = props;
  const initialConfiguration = use(initialConfigurationPromise);
  const shellConfiguration = useShellConfiguration(
    runtime,
    initialConfiguration,
  );

  const spectrumRouter = useSpectrumRouter();
  const colorScheme = useExtensionColorScheme(shellConfiguration);
  const credentials = resolveShellImsCredentials(shellConfiguration);

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
