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

import { createContext, useContext, useMemo } from "react";

import { useGuestConnection } from "./runtime/hooks/use-guest-connection";

import type { ReactNode } from "react";
import type { GuestConnection } from "./runtime/hooks/use-guest-connection";
import type { ShellConfiguration } from "./runtime/hooks/use-shell-configuration";

/** The shared context for a mounted Admin UI iframe app. */
export type SharedContext = {
  extensionId: string;

  imsProfile: NonNullable<ShellConfiguration["imsProfile"]> | null;
  imsToken: string | null;
  imsOrgId: string | null;
  locale: string | null;

  guestConnection: GuestConnection | null;
  sharedContext: GuestConnection["sharedContext"] | null;
};

// The context available for guests to the Admin UI.
const SharedContext = createContext<SharedContext | null>(null);

/** Returns the current UIX shared context for a mounted Admin UI iframe app. */
export function useSharedContext() {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error("useSharedContext must be used inside createExtensionApp.");
  }

  return context;
}

type SharedContextProviderProps = {
  children?: ReactNode;
  extensionId: string;
  shellConfiguration: ShellConfiguration | null;
};

/**
 * Provides the shared context for a mounted Admin UI iframe app.
 * @param props - The props needed to initialize the shared context.
 */
export function SharedContextProvider(
  props: Readonly<SharedContextProviderProps>,
) {
  const { children, extensionId, shellConfiguration } = props;

  const guestConnection = useGuestConnection(extensionId);
  const value = useMemo<SharedContext>(() => {
    console.log(
      "UIX shared context values:",
      shellConfiguration,
      guestConnection,
    );

    const {
      imsOrg = null,
      imsToken = null,
      imsProfile = null,
      locale = null,
    } = shellConfiguration ?? {};

    return {
      extensionId,
      imsToken,
      imsOrgId: imsOrg,
      imsProfile,
      locale,

      guestConnection,
      sharedContext: guestConnection?.sharedContext ?? null,
    };
  }, [extensionId, guestConnection, shellConfiguration]);

  return (
    <SharedContext.Provider value={value}>{children}</SharedContext.Provider>
  );
}
