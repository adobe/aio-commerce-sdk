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

import { useMemo } from "react";

import { useSharedContext } from "#web/react/commerce/context/shared-context.tsx";

import type { HostConnection } from "#web/react/commerce/types";

/**
 * The host actions exposed to mass-action and order view-button extension points, used to close
 * the extension iframe and navigate the Commerce Admin back to the originating grid or order.
 */
type HostFrameField = {
  close: () => Promise<void>;
  onError: () => Promise<void>;
};

/** The host integration API exposed to every extension point. */
type HostIntegration = {
  getCommerceHost: () => string;
};

/**
 * Returns typed helpers for interacting with the Commerce Admin host.
 *
 * @throws If called before the guest connection is established, or on an extension point where
 * the host does not provide the requested action (e.g. `close`/`closeWithError` on a menu page).
 */
export function useHostConnection(): HostConnection {
  const { host } = useSharedContext();

  return useMemo<HostConnection>(() => {
    const field = (host as { field?: HostFrameField }).field;
    const integration = (host as { integration?: HostIntegration }).integration;

    const requireField = () => {
      if (!field) {
        throw new Error(
          "Host frame actions are unavailable. They require an established guest connection with a host, and are only provided to mass-action and order view-button extension points.",
        );
      }

      return field;
    };

    const requireIntegration = () => {
      if (!integration) {
        throw new Error(
          "Host integration actions are unavailable. They require an established guest connection with a host.",
        );
      }

      return integration;
    };

    return {
      close: () => requireField().close(),
      closeWithError: () => requireField().onError(),
      getCommerceHost: () => requireIntegration().getCommerceHost(),
    };
  }, [host]);
}
