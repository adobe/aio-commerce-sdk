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

import { getMassActionAclResourceId } from "#mass-actions/acl-resource-id";

describe("getMassActionAclResourceId", () => {
  it("produces the order mass-action leaf id (cross-repo contract fixture)", () => {
    expect(
      getMassActionAclResourceId(
        "approval-dashboard-app",
        "order",
        "bulk-approve",
      ),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_massactions_bulk_approve",
    );
  });

  it("supports product and customer entities", () => {
    expect(
      getMassActionAclResourceId("acme-promotions", "product", "flag-review"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions_product_massactions_flag_review",
    );
    expect(
      getMassActionAclResourceId("acme-promotions", "customer", "assign-tier"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions_customer_massactions_assign_tier",
    );
  });

  it("trims and sanitizes both metadataId and actionId", () => {
    expect(
      getMassActionAclResourceId("  My-App  ", "order", "  Bulk Approve  "),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_order_massactions_bulk_approve",
    );
  });

  it("returns empty string when metadataId is blank", () => {
    expect(getMassActionAclResourceId("", "order", "bulk-approve")).toBe("");
    expect(getMassActionAclResourceId("   ", "order", "bulk-approve")).toBe("");
  });
});
