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
import type { Result } from "#web/react/types";

/**
 * Returns the context for a mass-action extension point: the selected row IDs the action was
 * triggered with. The value is read from the host-provided Commerce context.
 *
 * Returns an error outside the Commerce shared context, or when the mass-action selection is
 * missing, empty, or contains a non-string row ID.
 */
export function useMassActionContext(): Result<MassActionContext> {
  const { data, error } = useSharedContext();

  return useMemo<Result<MassActionContext>>(() => {
    if (error) {
      return { data: null, error };
    }

    // A missing key means the shared context was never populated with the mass-action payload.
    const selectedIds = data.sharedContext.get("selectedIds");
    if (!Array.isArray(selectedIds)) {
      return {
        data: null,
        error: new Error(
          "Could not find `selectedIds` in the Commerce shared context. Is this frame running as a mass-action extension point?",
        ),
      };
    }

    if (selectedIds.length === 0) {
      return {
        data: null,
        error: new Error(
          "No rows selected. A mass-action extension point must be triggered with at least one selected row.",
        ),
      };
    }

    if (selectedIds.some((id) => typeof id !== "string")) {
      return {
        data: null,
        error: new Error(
          "Some of the `selectedIds` in the Commerce shared context are not strings. All selected row IDs must be strings.",
        ),
      };
    }

    return { data: { selectedIds: selectedIds as string[] }, error: null };
  }, [data, error]);
}

/**
 * Returns the context for an order view-button extension point: the order ID the button was
 * triggered from.
 *
 * Returns an error when no order ID is present in the page URL.
 */
export function useOrderViewButtonContext(): Result<OrderViewButtonContext> {
  return useMemo<Result<OrderViewButtonContext>>(() => {
    const orderId = parseOrderId(globalThis.location.href);
    if (orderId === null) {
      return {
        data: null,
        error: new Error(
          "Could not find an order ID. Is this frame running as an order view-button extension point?",
        ),
      };
    }

    return { data: { orderId }, error: null };
  }, []);
}
