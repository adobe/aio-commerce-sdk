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
import { parseOrderId } from "#web/react/commerce/lib";

import type {
  MassActionContext,
  OrderViewButtonContext,
} from "#web/react/commerce/types";

/**
 * Returns the context for a mass-action extension point: the selected row IDs the action was
 * triggered with. The value is read from the host-provided Commerce context.
 *
 * @throws If used outside the Commerce shared context, or when that context does not include a
 * mass-action selection.
 */
export function useMassActionContext(): MassActionContext {
  const { sharedContext } = useSharedContext();

  return useMemo(() => {
    // An empty selection is valid (a mass action with nothing selected), but a missing key means
    // the shared context was never populated with the mass-action payload.
    const selectedIds = sharedContext.get("selectedIds");
    if (!Array.isArray(selectedIds)) {
      throw new Error(
        "Could not find `selectedIds` in the Commerce shared context. Is this frame running as a mass-action extension point?",
      );
    }

    return { selectedIds: selectedIds as string[] };
  }, [sharedContext]);
}

/**
 * Returns the context for an order view-button extension point: the order ID the button was
 * triggered from.
 *
 * @throws If no order ID is present in the page URL.
 */
export function useOrderViewButtonContext(): OrderViewButtonContext {
  return useMemo(() => {
    const orderId = parseOrderId(globalThis.location.href);
    if (orderId === null) {
      throw new Error(
        "Could not find an order ID. Is this frame running as an order view-button extension point?",
      );
    }

    return { orderId };
  }, []);
}
