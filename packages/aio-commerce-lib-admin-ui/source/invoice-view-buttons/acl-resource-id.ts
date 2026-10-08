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
 * Derives the Commerce ACL resource ID for an invoice view button.
 * App and button IDs are trimmed, lowercased, and sanitized independently.
 *
 * @param metadataId - The application's `metadata.id` value.
 * @param buttonId - The button's `adminUi.invoice.viewButtons[].id` value.
 * @returns The invoice view-button leaf ID, or an empty string when `metadataId` is blank.
 * @example
 * ```ts
 * getInvoiceViewButtonAclResourceId("billing-app", "export-invoice");
 * // "Magento_CommerceBackendUix::adminuisdk_app_billing_app_invoice_viewbuttons_export_invoice"
 * ```
 */
export function getInvoiceViewButtonAclResourceId(
  metadataId: string,
  buttonId: string,
): string {
  const appRoot = getAclResourceId(metadataId);
  if (appRoot === "") {
    return "";
  }
  return `${appRoot}_invoice_viewbuttons_${sanitizeSegment(buttonId)}`;
}
