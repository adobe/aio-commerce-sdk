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

/**
 * Returns typed helpers for closing the extension iframe and handing control back to the Commerce
 * Admin host. These are only available on mass-action and order view-button extension points; the
 * host does not expose them to menu extension points.
 *
 * @throws If called before the guest connection is established, or on an extension point where the
 * host does not provide the frame actions (e.g. a menu page).
 */
export function useHostConnection(): HostConnection {
  const { host } = useSharedContext();

  return useMemo<HostConnection>(() => {
    const field = (host as { field?: HostFrameField }).field;
    const requireField = () => {
      if (!field) {
        throw new Error(
          "Host frame actions are unavailable. They require an established guest connection with a host.",
        );
      }

      return field;
    };

    return {
      close: () => requireField().close(),
      closeWithError: () => requireField().onError(),
    };
  }, [host]);
}
