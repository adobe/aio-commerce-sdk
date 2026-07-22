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
  use,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

import { error, ok } from "#web/react/result";

import type { ReactNode } from "react";
import type { useCommerce } from "#web/react/commerce/hooks/use-commerce";
import type {
  useMassActionContext,
  useOrderViewButtonContext,
} from "#web/react/commerce/hooks/use-extension-context";
import type {
  GuestConnection,
  SharedContext,
  SharedContextState,
} from "#web/react/commerce/types";
import type { Result } from "#web/react/result";

const SharedContextValue = createContext<SharedContextState | undefined>(
  undefined,
);

/**
 * Returns the current Commerce shared context provider state.
 */
export function useInternalSharedContext(): SharedContextState | undefined {
  // Keep absence handleable so public hooks can return a Result instead of throwing first.
  return use(SharedContextValue);
}

/**
 * Returns the current Commerce shared context. The guest connection is already established by
 * the time this can be called (see {@link SharedContextProvider}).
 *
 * This is a low-level escape hatch that exposes the raw `sharedContext` and `host` objects.
 * Prefer a purpose-built hook ({@link useCommerce}, {@link useMassActionContext},
 * {@link useOrderViewButtonContext}) when one covers what you need.
 *
 * @example
 * ```tsx
 * import { useSharedContext } from "@adobe/aio-commerce-lib-admin-ui/web";
 *
 * function ImsTokenLabel() {
 *   const { data, error } = useSharedContext();
 *   if (error) return null;
 *   return <span>{data.sharedContext.get("imsToken")}</span>;
 * }
 * ```
 */
export function useSharedContext(): Result<SharedContext> {
  const context = useInternalSharedContext();
  const sharedContext = useLiveSharedContext(context?.guestConnection);

  return useMemo<Result<SharedContext>>(() => {
    if (!context) {
      return error(
        "useSharedContext must be used inside a SharedContextProvider, which is only available in the Commerce Admin.",
      );
    }

    if (!sharedContext) {
      return error(
        "The Commerce host did not provide a shared context for this extension.",
      );
    }

    return ok({
      extensionId: context.extensionId,
      host: context.guestConnection.host,
      sharedContext,
    });
  }, [context, sharedContext]);
}

/**
 * Tracks the live UIX `sharedContext` for a connection.
 *
 * The host shares `sharedContext` on connect and may reassign it on later `contextchange`
 * events. `useSyncExternalStore` subscribes to those events and surfaces the current instance
 * (whose reference changes on each update), so consumers re-render when the host updates it.
 *
 * @param guestConnection - The established guest connection.
 */
function useLiveSharedContext(guestConnection?: GuestConnection) {
  const subscribe = useCallback(
    (onContextChange: () => void) => {
      if (!guestConnection) {
        return () => undefined;
      }

      return guestConnection.addEventListener("contextchange", onContextChange);
    },
    [guestConnection],
  );

  return useSyncExternalStore(
    subscribe,
    () => guestConnection?.sharedContext ?? null,
  );
}

type SharedContextProviderProps = {
  children?: ReactNode;
  guestConnection: GuestConnection;
  extensionId: string;
};

/**
 * Provides the Commerce shared context for a mounted Admin UI iframe app.
 * @param props - The props needed to initialize the shared context, including the already
 * established guest connection.
 */
export function SharedContextProvider(
  props: Readonly<SharedContextProviderProps>,
) {
  const { children, guestConnection, extensionId } = props;
  const value = useMemo<SharedContextState>(
    () => ({ extensionId, guestConnection }),
    [extensionId, guestConnection],
  );

  return (
    <SharedContextValue.Provider value={value}>
      {children}
    </SharedContextValue.Provider>
  );
}
