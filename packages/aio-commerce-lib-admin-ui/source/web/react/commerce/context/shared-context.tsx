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

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { useGuestConnection } from "#web/react/commerce/hooks/use-guest-connection";

import type { ReactNode } from "react";
import type {
  GuestConnection,
  SharedContext,
  SharedContextState,
} from "#web/react/commerce/types";

const SharedContextValue = createContext<SharedContextState | undefined>(
  undefined,
);

/**
 * Returns the current Commerce shared context provider state.
 */
export function useInternalSharedContext(): SharedContextState {
  const context = useContext(SharedContextValue);
  if (context === undefined) {
    throw new Error(
      "useSharedContext must be used inside a SharedContextProvider.",
    );
  }

  return context;
}

/**
 * Returns the current Commerce shared context.
 *
 * @throws If no Commerce connection is available.
 */
export function useSharedContext(): SharedContext {
  const context = useInternalSharedContext();
  if (!(context.sharedContext && context.host)) {
    throw new Error(
      "useSharedContext can only be used inside the Commerce Admin after the guest connection is established.",
    );
  }

  return {
    extensionId: context.extensionId,
    sharedContext: context.sharedContext,
    host: context.host,
  };
}

/**
 * Tracks the live UIX `sharedContext` for a connection.
 *
 * The host shares `sharedContext` on connect and may reassign it on later `contextchange`
 * events. `useSyncExternalStore` subscribes to those events and surfaces the current instance
 * (whose reference changes on each update), so consumers re-render when the host updates it.
 *
 * @param guestConnection - The active guest connection, or null before it is established.
 */
function useLiveSharedContext(guestConnection: GuestConnection | null) {
  const subscribe = useCallback(
    (onContextChange: () => void) =>
      guestConnection?.addEventListener("contextchange", onContextChange) ??
      (() => undefined),
    [guestConnection],
  );

  return useSyncExternalStore(
    subscribe,
    () => guestConnection?.sharedContext ?? null,
  );
}

type SharedContextProviderProps = {
  children?: ReactNode;
  extensionId: string;
};

/**
 * Provides the Commerce shared context for a mounted Admin UI iframe app.
 * @param props - The props needed to initialize the shared context.
 */
export function SharedContextProvider(
  props: Readonly<SharedContextProviderProps>,
) {
  const { children, extensionId } = props;

  const guestConnection = useGuestConnection(extensionId);
  const sharedContext = useLiveSharedContext(guestConnection);

  const value = useMemo<SharedContextState>(
    () => ({
      extensionId,
      sharedContext,
      host: guestConnection?.host ?? null,
    }),
    [extensionId, guestConnection?.host, sharedContext],
  );

  return (
    <SharedContextValue.Provider value={value}>
      {children}
    </SharedContextValue.Provider>
  );
}
