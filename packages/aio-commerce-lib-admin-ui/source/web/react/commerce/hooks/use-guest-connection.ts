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
import { useEffect, useState } from "react";

import type { GuestConnection } from "#web/react/commerce/types";

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

    attach({ id: extensionId })
      .then((connection) => {
        if (isActive) {
          setGuestConnection(connection);
        }
      })
      .catch((err) => {
        console.error("UIX guest attach failed:", err);
      });

    return () => {
      isActive = false;
    };
  }, [extensionId]);

  return guestConnection;
}
