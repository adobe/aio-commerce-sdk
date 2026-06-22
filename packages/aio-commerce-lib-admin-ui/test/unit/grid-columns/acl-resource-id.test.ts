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

import { getGridColumnAclResourceId } from "#grid-columns/acl-resource-id";

describe("getGridColumnAclResourceId", () => {
  it("produces the order grid-column leaf id (cross-repo contract fixture)", () => {
    expect(
      getGridColumnAclResourceId(
        "approval-dashboard-app",
        "order",
        "order_status",
      ),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_gridcolumns_order_status",
    );
  });

  it("supports product and customer entities", () => {
    expect(
      getGridColumnAclResourceId("acme-promotions", "product", "approval-req"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions_product_gridcolumns_approval_req",
    );
    expect(
      getGridColumnAclResourceId("acme-promotions", "customer", "Tier"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions_customer_gridcolumns_tier",
    );
  });

  it("trims and sanitizes both metadataId and columnId", () => {
    expect(
      getGridColumnAclResourceId("  My-App  ", "order", "  My-Col  "),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_order_gridcolumns_my_col",
    );
  });

  it("returns empty string when metadataId is blank", () => {
    expect(getGridColumnAclResourceId("", "order", "order_status")).toBe("");
    expect(getGridColumnAclResourceId("   ", "order", "order_status")).toBe("");
  });
});
