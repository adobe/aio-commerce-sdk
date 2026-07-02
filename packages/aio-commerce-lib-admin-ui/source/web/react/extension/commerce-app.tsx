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
import { Provider } from "@react-spectrum/s2/Provider";
import { Outlet as ActiveRoute } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import { resolveCommerceImsCredentials } from "#web/react/auth/lib";
import { CenteredProgress } from "#web/react/centered-progress.tsx";
import {
  SharedContextProvider,
  useSharedContext,
} from "#web/react/commerce/context/shared-context.tsx";
import { useGuestConnection } from "#web/react/commerce/hooks/use-guest-connection";
import { isControlFrame } from "#web/react/commerce/lib";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";
import { syncRootColorScheme } from "#web/react/theme";

import { ExtensionErrorBoundary } from "./error-boundary";

/** The fallback UI shown when connecting to the Commerce host. */
function ConnectionFallback() {
  return <CenteredProgress aria-label="Connecting to Commerce Admin" />;
}

/**
 * Renders the Commerce Admin flow: a control frame only needs to register itself with the UIX
 * host (no visible content), while a UI frame renders the routed extension-point content once
 * its guest connection is established.
 *
 * @param props - The props needed to initialize the extension app.
 */
export function CommerceExtensionApp(props: Readonly<{ extensionId: string }>) {
  const { extensionId } = props;
  const spectrumRouter = useSpectrumRouter();

  // Commerce Admin always uses the light theme, so there's nothing to wait on for it, but the
  // root attribute still needs syncing since Spectrum S2's page styles key off it.
  useEffect(() => {
    syncRootColorScheme("light");
  }, []);

  if (isControlFrame()) {
    return <ControlFrameRegistration extensionId={extensionId} />;
  }

  return (
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
  const guestConnection = useGuestConnection(extensionId);

  return (
    <SharedContextProvider
      extensionId={extensionId}
      guestConnection={guestConnection}>
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
      <ActiveRoute />
    </ImsContextProvider>
  );
}
