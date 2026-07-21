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
import { error, ok } from "#web/react/result";

import type { GuestConnection } from "#web/react/commerce/types";
import type { Result } from "#web/react/result";

/** The host integration API exposed to every extension point. */
type HostIntegration = {
  getCommerceHost: () => Promise<string>;
};

type CommerceData = { commerceHost: string };

const commerceHosts = createRetryablePromiseCache<Result<CommerceData>>(
  (result) => result.error !== null,
);

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
): Promise<Result<CommerceData>> {
  return commerceHosts.get(extensionId, async () => {
    const { integration } = connection.host as {
      integration?: HostIntegration;
    };

    if (!integration) {
      return error(
        "The host does not provide the integration API needed to resolve the Commerce host.",
      );
    }

    try {
      const commerceHost = await integration.getCommerceHost();
      return ok({ commerceHost });
    } catch (cause) {
      return error("Failed to resolve the Commerce host.", { cause });
    }
  });
}

/** Drops a failed Commerce host resolution for `extensionId`, so a later render retries it. */
export function retryCommerceHost(extensionId: string) {
  commerceHosts.evictIfFailed(extensionId);
}

/**
 * Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over
 * the guest connection.
 *
 * Returns an error when used outside a Commerce Admin UI frame, when the host does not expose the
 * Commerce integration API, or when resolving the host fails.
 */
export function useCommerce(): Result<CommerceData> {
  const context = useInternalSharedContext();
  if (!context) {
    return error("useCommerce requires running inside the Commerce Admin.");
  }

  return use(
    getCommerceHostPromise(context.extensionId, context.guestConnection),
  );
}
