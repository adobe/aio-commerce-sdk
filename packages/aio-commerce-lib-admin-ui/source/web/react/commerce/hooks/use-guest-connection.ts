import { attach, register } from "@adobe/uix-guest";
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

    // Our host doesn't communicate with the extension as there are no `methods`
    // We don't use the returned `GuestServer`, this call is kept for future compatibility.
    register({ id: extensionId, methods: {} }).catch((err) => {
      console.error("UIX guest register failed:", err);
    });

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
