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

import { describe, expect, it } from "vitest";

import { getInvoiceViewButtonAclResourceId } from "#invoice-view-buttons/index";

describe("getInvoiceViewButtonAclResourceId", () => {
  it("produces an invoice view-button leaf ID", () => {
    expect(
      getInvoiceViewButtonAclResourceId("billing-app", "export-invoice"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_billing_app_invoice_viewbuttons_export_invoice",
    );
  });

  it("trims and sanitizes both segments", () => {
    expect(
      getInvoiceViewButtonAclResourceId("  My-App  ", "  Export Invoice!  "),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_invoice_viewbuttons_export_invoice_",
    );
  });

  it.each(["", "   "])(
    "returns an empty string for blank metadataId %j",
    (id) => {
      expect(getInvoiceViewButtonAclResourceId(id, "export-invoice")).toBe("");
    },
  );
});
