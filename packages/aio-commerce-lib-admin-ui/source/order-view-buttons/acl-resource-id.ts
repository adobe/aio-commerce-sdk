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
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).
 * @param buttonId - The button's `id` value from `adminUi.order.viewButtons[].id`.
 * @returns The full Commerce ACL resource id for the view-button leaf node (e.g.
 *   `"Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_viewbuttons_approve_order"`),
 *   or an empty string when `metadataId` is blank.
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
