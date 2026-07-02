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
import { createRetryablePromiseCache } from "#web/react/promise-cache";

import type { GuestConnection } from "#web/react/commerce/types";

/** The host integration API exposed to every extension point. */
type HostIntegration = {
  getCommerceHost: () => Promise<string>;
};

const commerceHosts = createRetryablePromiseCache<string>();

/**
 * Returns the cached Commerce Admin host promise for an extension, resolving it once over the
 * given guest connection. The value is static for the lifetime of the connection.
 *
 * @param extensionId - The unique identifier for the extension app.
 * @param connection - The established guest connection.
 */
function getCommerceHostPromise(
  extensionId: string,
  connection: GuestConnection,
): Promise<string> {
  const integration = (connection.host as { integration?: HostIntegration })
    .integration;

  if (!integration) {
    // Rejects synchronously, so there's no pending window for `use` to keep stable and nothing
    // to cache: a later attempt re-checks for free and could succeed if the host changes.
    return Promise.reject(
      new Error(
        "The host does not provide the integration API needed to resolve the Commerce host.",
      ),
    );
  }

  return commerceHosts(extensionId, () => integration.getCommerceHost());
}

/**
 * Returns the host (domain) of the Commerce Admin the extension is embedded in, suspending until
 * it's resolved over the guest connection.
 *
 * @throws If used outside a Commerce Admin UI frame.
 */
export function useCommerce() {
  const { extensionId, guestConnection } = useInternalSharedContext();
  const commerceHost = use(
    getCommerceHostPromise(extensionId, guestConnection),
  );

  return { commerceHost };
}
