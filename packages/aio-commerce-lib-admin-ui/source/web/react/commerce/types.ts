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

import type { attach } from "@adobe/uix-guest";
import type { ImsContext } from "#web/react/auth/types";

/** The guest connection that shares the context between the extension and the Admin UI host. */
export type GuestConnection = Awaited<ReturnType<typeof attach>>;

/** The Commerce shared context provider state for a mounted Admin UI iframe app. */
export type SharedContextState = {
  /** The extension ID of the app. */
  extensionId: string;

  /** The established guest connection. */
  guestConnection: GuestConnection;
};

/**
 * The Commerce shared context for a mounted Admin UI iframe app.
 *
 * This only exists when the app runs inside the Commerce Admin: it is provided by the Commerce UIX
 * host over the guest connection. It is distinct from the IMS credentials ({@link ImsContext}),
 * which are also available in the Experience Cloud shell.
 */
export type SharedContext = {
  /** The extension ID of the app. */
  extensionId: string;

  /** The live `sharedContext` object provided by the host. */
  sharedContext: NonNullable<GuestConnection["sharedContext"]>;

  /** The host proxy, used by `useHostConnection` to invoke host-frame actions (close/onError). */
  host: NonNullable<GuestConnection["host"]>;
};

/** Actions for closing the extension iframe and returning control to the Commerce Admin. */
export type HostConnection = {
  /** Closes the iframe and navigates back to the originating grid or order. */
  close: () => Promise<void>;

  /** Closes the iframe and navigates back, flagging the originating page that an error occurred. */
  closeWithError: () => Promise<void>;
};

/** The context shared with mass-action extension points. */
export type MassActionContext = {
  selectedIds: string[];
};

/** The context shared with order view-button extension points. */
export type OrderViewButtonContext = {
  orderId: string | null;
};
