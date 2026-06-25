import { attach, register } from "@adobe/uix-guest";
import { useEffect, useState } from "react";

/** Defines the guest connection that shares the context between the extension and the Admin UI host. */
export type GuestConnection = Awaited<ReturnType<typeof attach>>;

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
    register({ id: extensionId, methods: {} })
      .then(() => attach({ id: extensionId }))
      .then((connection) => {
        console.log("UIX guest connection established:", connection, isActive);
        if (isActive) {
          setGuestConnection(connection);
        }
      })
      .catch((err: unknown) => {
        console.error("UIX guest connection failed:", err);
      });

    return () => {
      isActive = false;
    };
  }, [extensionId]);

  return guestConnection;
}
