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

import { getAclResourceId, sanitizeSegment } from "#api/lib/acl-resource-id";

/**
 * Derives the deterministic Commerce ACL resource id for an order view button.
 *
 * View buttons exist only on the order entity, so no entity discriminator is needed.
 * The id is assembled as: `getAclResourceId(metadataId)` + `"_order_viewbuttons_"` +
 * sanitized `buttonId`. The `buttonId` is sanitized (trimmed, lowercased, non-`[a-z0-9_]` → `_`).
 * `"Magento_CommerceBackendUix::adminuisdk_app_"` in the example is the fixed constant prefix
 * (not a placeholder), and `"_order_viewbuttons_"` is the literal keyword separator for this component:
 *
 * @example
 * ```
 * getOrderViewButtonAclResourceId("approval-dashboard-app", "approve-order")
 * // getAclResourceId("approval-dashboard-app")                          + "_order_viewbuttons_" + sanitize("approve-order")
 * // "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app" + "_order_viewbuttons_" + "approve_order"
 * // → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_viewbuttons_approve_order"
 * ```
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).
 * @param buttonId - The button's `id` value from `adminUi.order.viewButtons[].id`.
 * @returns The full Commerce ACL resource id for the view-button leaf node, or an empty string
 *   when `metadataId` is blank.
 */
export function getOrderViewButtonAclResourceId(
  metadataId: string,
  buttonId: string,
): string {
  const appRoot = getAclResourceId(metadataId);
  if (appRoot === "") {
    return "";
  }
  return `${appRoot}_order_viewbuttons_${sanitizeSegment(buttonId)}`;
}
