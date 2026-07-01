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

import { register } from "@adobe/uix-guest";
import { ProgressCircle } from "@react-spectrum/s2/ProgressCircle";
import { Provider } from "@react-spectrum/s2/Provider";
import { Outlet } from "@tanstack/react-router";
import { Suspense, use, useEffect } from "react";

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import {
  resolveCommerceImsCredentials,
  resolveShellImsCredentials,
} from "#web/react/auth/lib";
import {
  SharedContextProvider,
  useSharedContext,
} from "#web/react/commerce/context/shared-context.tsx";
import { useGuestConnection } from "#web/react/commerce/hooks/use-guest-connection";
import { isControlFrame, isUiFrame } from "#web/react/commerce/lib";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";
import { useExtensionColorScheme } from "#web/react/shell/hooks/use-extension-color-scheme";
import { useShellConfiguration } from "#web/react/shell/hooks/use-shell-configuration";

import { ExtensionErrorBoundary } from "./extension-error-boundary";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";

/** The props received by the {@link ExtensionApp} component. */
type ExtensionAppProps = {
  extensionId: string;
  initialConfigurationPromise: Promise<RuntimeConfiguration | null>;
  runtime: Runtime;
};

/** A centered, indeterminate progress indicator used as a Suspense fallback. */
function CenteredProgress(props: Readonly<{ "aria-label": string }>) {
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
      <ProgressCircle aria-label={props["aria-label"]} isIndeterminate />
    </div>
  );
}

/** The fallback UI shown when connecting to the Commerce host. */
function ConnectionFallback() {
  return <CenteredProgress aria-label="Connecting to Commerce Admin" />;
}

/** The fallback UI shown while waiting for the Experience Cloud shell to become ready. */
function ShellFallback() {
  return <CenteredProgress aria-label="Loading experience cloud runtime" />;
}

/**
 * The ExtensionApp component is the main entry point for an extension app. It picks between the
 * Commerce Admin and Experience Cloud shell (or standalone) flows: which one applies is known
 * synchronously via `isUiFrame()`/`isControlFrame()`, before anything needs to be awaited.
 *
 * @param props - The props needed to initialize the extension app.
 */
export function ExtensionApp(props: Readonly<ExtensionAppProps>) {
  const { extensionId, initialConfigurationPromise, runtime } = props;

  return isUiFrame() || isControlFrame() ? (
    <CommerceExtensionApp extensionId={extensionId} />
  ) : (
    <ShellExtensionApp
      initialConfigurationPromise={initialConfigurationPromise}
      runtime={runtime}
    />
  );
}

/**
 * Renders the Commerce Admin flow: a control frame only needs to register itself with the UIX
 * host (no visible content), while a UI frame renders the routed extension-point content once
 * its guest connection is established.
 */
function CommerceExtensionApp(props: Readonly<{ extensionId: string }>) {
  const { extensionId } = props;
  const spectrumRouter = useSpectrumRouter();

  if (isControlFrame()) {
    return <ControlFrameRegistration extensionId={extensionId} />;
  }

  return (
    // Commerce Admin always uses the light theme, so there's nothing to wait on for it.
    <Provider colorScheme="light" router={spectrumRouter}>
      <ExtensionErrorBoundary>
        <Suspense fallback={<ConnectionFallback />}>
          <CommerceGuestConnection extensionId={extensionId} />
        </Suspense>
      </ExtensionErrorBoundary>
    </Provider>
  );
}

/**
 * Registers a Commerce Admin control frame with the UIX host. Renders no visible content.
 * @param props - The props needed to initialize the extension app.
 */
function ControlFrameRegistration(props: Readonly<{ extensionId: string }>) {
  const { extensionId } = props;
  useEffect(() => {
    register({ id: extensionId, methods: {} }).catch((err) => {
      console.error("UIX guest register failed:", err);
    });
  }, [extensionId]);

  return null;
}

/**
 * Suspends until the guest connection is established, then provides the Commerce shared context.
 * @param props - The props needed to initialize the extension app.
 */
function CommerceGuestConnection(props: Readonly<{ extensionId: string }>) {
  const { extensionId } = props;
  const connection = useGuestConnection(extensionId);

  return (
    <SharedContextProvider connection={connection} extensionId={extensionId}>
      <CommerceExtensionContent />
    </SharedContextProvider>
  );
}

/** Renders IMS-gated route content for a Commerce Admin UI frame. */
function CommerceExtensionContent() {
  const { sharedContext } = useSharedContext();
  const credentials = resolveCommerceImsCredentials(sharedContext);

  return (
    <ImsContextProvider credentials={credentials}>
      <Outlet />
    </ImsContextProvider>
  );
}

/**
 * Renders the Experience Cloud shell flow (also covers the raw HTML page running standalone with
 * no host frame at all: `initialConfigurationPromise` is already resolved for it, so it never
 * actually suspends).
 */
function ShellExtensionApp(
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

/** Renders IMS-gated route content once the shell/runtime configuration is known. */
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
