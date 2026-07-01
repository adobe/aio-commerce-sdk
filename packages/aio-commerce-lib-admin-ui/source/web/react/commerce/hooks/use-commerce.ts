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

import { use } from "react";

import { useInternalSharedContext } from "#web/react/commerce/context/shared-context.tsx";
import { getGuestConnectionPromise } from "#web/react/commerce/hooks/use-guest-connection";

/** The host integration API exposed to every extension point. */
type HostIntegration = {
  getCommerceHost: () => Promise<string>;
};

const commerceHostCache = new Map<string, Promise<string>>();

/**
 * Returns the cached Commerce Admin host promise for an extension, resolving it once over the
 * guest connection. The value is static for the lifetime of the connection.
 */
function getCommerceHostPromise(extensionId: string): Promise<string> {
  let promise = commerceHostCache.get(extensionId);
  if (!promise) {
    promise = getGuestConnectionPromise(extensionId).then((connection) => {
      const integration = (connection.host as { integration?: HostIntegration })
        .integration;

      if (!integration) {
        throw new Error(
          "The host does not provide the integration API needed to resolve the Commerce host.",
        );
      }

      return integration.getCommerceHost();
    });

    commerceHostCache.set(extensionId, promise);
  }

  return promise;
}

/**
 * Returns the host (domain) of the Commerce Admin the extension is embedded in, suspending until
 * the guest connection is established.
 *
 * @throws If the app isn't running inside a Commerce Admin UI frame at all.
 */
export function useCommerce() {
  const { extensionId } = useInternalSharedContext();
  const commerceHost = use(getCommerceHostPromise(extensionId));

  return { commerceHost };
}
