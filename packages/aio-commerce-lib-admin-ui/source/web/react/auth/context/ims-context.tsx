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

import { createContext, use } from "react";

import { isEmbeddedInHost } from "#web/react/commerce/lib";

import type { ReactNode } from "react";
import type { ImsContext } from "#web/react/auth/types";

// `undefined` means there is no provider (a usage error); `null` means the provider is mounted but no host
// has provided credentials (running standalone, outside both the Commerce Admin and the Experience Cloud shell).
const ImsContextValue = createContext<ImsContext | null | undefined>(undefined);

/**
 * Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the
 * Experience Cloud shell.
 *
 * @throws If no host provides credentials (e.g. the app is running standalone, outside both the
 * Commerce Admin and the Experience Cloud shell).
 */
export function useIms(): ImsContext {
  const credentials = use(ImsContextValue);
  if (credentials === undefined) {
    throw new Error("useIms must be used inside an ImsContextProvider.");
  }

  if (!credentials) {
    throw new Error(
      "useIms requires running inside the Commerce Admin or the Experience Cloud shell, which provide the IMS credentials.",
    );
  }

  return credentials;
}

type ImsContextProviderProps = {
  children?: ReactNode;
  credentials: ImsContext | null;
};

/**
 * Provides the IMS credentials for a mounted Admin UI iframe app.
 * @param props - The resolved credentials (or null while unavailable) and the children to render.
 */
export function ImsContextProvider(props: Readonly<ImsContextProviderProps>) {
  const { children, credentials } = props;

  // When embedded in a host, children are withheld until the credentials resolve, so consumers observe non-null
  // credentials and avoid a race against the asynchronous handshake. When running standalone (top-level window),
  // children render immediately and `useIms` throws (as we won't have any host providing credentials).
  if (isEmbeddedInHost() && !credentials) {
    return null;
  }

  return (
    <ImsContextValue.Provider value={credentials}>
      {children}
    </ImsContextValue.Provider>
  );
}
