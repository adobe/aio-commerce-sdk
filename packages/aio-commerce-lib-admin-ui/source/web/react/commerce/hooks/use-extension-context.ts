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
 * Returns the context for a mass-action extension point: the selected row IDs the action was triggered
 * with. Mass actions are a Commerce-only extension point, so this requires the Commerce connection.
 *
 * @throws If used outside a Commerce mass-action page (e.g. in the Experience Cloud shell).
 */
export function useMassActionContext(): MassActionContext {
  const { sharedContext } = useSharedContext();

  return useMemo(
    () => ({
      selectedIds: (sharedContext.get("selectedIds") as string[]) ?? [],
    }),
    [sharedContext],
  );
}

/**
 * Returns the context for an order view-button extension point: the order ID the button was
 * triggered from.
 */
export function useOrderViewButtonContext(): OrderViewButtonContext {
  return useMemo(
    () => ({
      orderId: parseOrderId(globalThis.location.href),
    }),
    [],
  );
}
