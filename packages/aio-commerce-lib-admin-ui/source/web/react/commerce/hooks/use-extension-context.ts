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

import { useIms } from "#web/react/auth/context/ims-context.tsx";
import { useSharedContext } from "#web/react/commerce/context/shared-context.tsx";
import { parseOrderId } from "#web/react/commerce/lib";

import type {
  MassActionContext,
  OrderViewButtonContext,
} from "#web/react/commerce/types";

/**
 * Returns the context for a mass-action extension point: the IMS credentials plus the selected
 * row IDs and the Commerce instance the action was triggered from.
 *
 * Mass actions are a Commerce-only extension point, so this requires the Commerce connection.
 *
 * @throws If used outside a Commerce mass-action page (e.g. in the Experience Cloud shell).
 */
export function useMassActionContext(): MassActionContext {
  const { imsToken, imsOrgId } = useIms();
  const context = useSharedContext();

  return useMemo(() => {
    const { sharedContext } = context;
    return {
      imsToken,
      imsOrgId,
      selectedIds: (sharedContext.get("selectedIds") as string[]) ?? [],
      commerceBaseUrl: sharedContext.get("commerceBaseUrl") as string,
      clientId: sharedContext.get("clientId") as string,
    };
  }, [imsToken, imsOrgId, context]);
}

/**
 * Returns the context for an order view-button extension point: the IMS credentials plus the
 * order ID the button was triggered from. The order ID comes from the URL path parameter the
 * host sets, not from the shared context.
 */
export function useOrderViewButtonContext(): OrderViewButtonContext {
  const { imsToken, imsOrgId } = useIms();

  return useMemo(
    () => ({
      imsToken,
      imsOrgId,
      orderId: parseOrderId(globalThis.location.href),
    }),
    [imsToken, imsOrgId],
  );
}
