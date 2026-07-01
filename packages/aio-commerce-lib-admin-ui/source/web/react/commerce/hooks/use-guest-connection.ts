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

import { attach, register } from "@adobe/uix-guest";
import { useEffect, useState } from "react";

import { isControlFrame, isUiFrame } from "#web/react/commerce/lib";

import type { GuestConnection } from "#web/react/commerce/types";

const connectionCache = new Map<string, Promise<GuestConnection>>();

/**
 * Returns the cached guest connection promise for an extension, attaching on first call. Only UI
 * frames can attach; every other frame type rejects, since only UI frames render the routed
 * extension-point content that needs an established connection.
 *
 * @param extensionId - The unique identifier for the extension app.
 */
export function getGuestConnectionPromise(
  extensionId: string,
): Promise<GuestConnection> {
  let promise = connectionCache.get(extensionId);
  if (!promise) {
    promise = isUiFrame()
      ? attach({ id: extensionId })
      : Promise.reject(
          new Error(
            "Not running as a Commerce Admin UI frame; no guest connection is available.",
          ),
        );

    connectionCache.set(extensionId, promise);
  }

  return promise;
}

/**
 * Establishes a guest connection for the given extension ID and returns the connection object.
 * @param extensionId - The unique identifier for the extension app.
 */
export function useGuestConnection(
  extensionId: string,
): GuestConnection | null {
  const [guestConnection, setGuestConnection] =
    useState<GuestConnection | null>(null);

  useEffect(() => {
    let isActive = true;

    if (isUiFrame()) {
      getGuestConnectionPromise(extensionId)
        .then((connection) => {
          if (isActive) {
            setGuestConnection(connection);
          }
        })
        .catch((err) => {
          console.error("UIX guest attach failed:", err);
        });
    } else if (isControlFrame()) {
      register({ id: extensionId, methods: {} }).catch((err) => {
        console.error("UIX guest register failed:", err);
      });
    }

    return () => {
      isActive = false;
    };
  }, [extensionId]);

  return guestConnection;
}
