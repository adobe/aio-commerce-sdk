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

import { attach } from "@adobe/uix-guest";
import { use } from "react";

import type { GuestConnection } from "#web/react/commerce/types";

const connectionCache = new Map<string, Promise<GuestConnection>>();

function getGuestConnectionPromise(
  extensionId: string,
): Promise<GuestConnection> {
  let promise = connectionCache.get(extensionId);
  if (!promise) {
    promise = attach({ id: extensionId });
    connectionCache.set(extensionId, promise);
  }

  return promise;
}

/**
 * Suspends until the guest connection for the given extension is established.
 * @param extensionId - The unique identifier for the extension app.
 */
export function useGuestConnection(extensionId: string): GuestConnection {
  return use(getGuestConnectionPromise(extensionId));
}
