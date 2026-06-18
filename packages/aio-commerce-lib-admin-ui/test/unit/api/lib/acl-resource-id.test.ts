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

import {
  getAclResourceId,
  getGridColumnAclResourceId,
  getMassActionAclResourceId,
  getMenuAclResourceId,
  getOrderViewButtonAclResourceId,
} from "#api/lib/acl-resource-id";

describe("getAclResourceId", () => {
  it("converts hyphens to underscores and lowercases (cross-repo contract fixture)", () => {
    expect(getAclResourceId("acme-promotions")).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions",
    );
  });

  it("trims whitespace before sanitizing (cross-repo contract with Commerce module)", () => {
    expect(getAclResourceId("  acme-promotions  ")).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions",
    );
  });

  it("handles mixed case with digits", () => {
    expect(getAclResourceId("My-App-2")).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_2",
    );
  });

  it("returns empty string for blank input", () => {
    expect(getAclResourceId("")).toBe("");
    expect(getAclResourceId("   ")).toBe("");
  });
});

describe("getMenuAclResourceId", () => {
  it("produces the menu leaf id (cross-repo contract fixture)", () => {
    expect(
      getMenuAclResourceId("approval-dashboard-app", "approval_dashboard"),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard",
    );
  });

  it("sanitizes hyphens in both metadataId and menuId independently", () => {
    expect(getMenuAclResourceId("My-App", "My-Item")).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_menu_my_item",
    );
  });

  it("trims whitespace in both segments before sanitizing", () => {
    expect(
      getMenuAclResourceId(
        "  approval-dashboard-app  ",
        "  approval_dashboard  ",
      ),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard",
    );
  });

  it("produces the same id whether menuId uses hyphens or underscores", () => {
    expect(
      getMenuAclResourceId("approval-dashboard-app", "approval-dashboard"),
    ).toBe(
      getMenuAclResourceId("approval-dashboard-app", "approval_dashboard"),
    );
  });

  it("returns empty string when metadataId is blank", () => {
    expect(getMenuAclResourceId("", "approval_dashboard")).toBe("");
    expect(getMenuAclResourceId("   ", "approval_dashboard")).toBe("");
  });
});

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

  it("returns empty string when metadataId is blank", () => {
    expect(getMassActionAclResourceId("", "order", "bulk-approve")).toBe("");
  });
});

describe("getOrderViewButtonAclResourceId", () => {
  it("produces the order view-button leaf id (cross-repo contract fixture)", () => {
    expect(
      getOrderViewButtonAclResourceId(
        "approval-dashboard-app",
        "approve-order",
      ),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_viewbuttons_approve_order",
    );
  });

  it("trims and sanitizes both segments", () => {
    expect(
      getOrderViewButtonAclResourceId("  My-App  ", "  Approve Order  "),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_order_viewbuttons_approve_order",
    );
  });

  it("returns empty string when metadataId is blank", () => {
    expect(getOrderViewButtonAclResourceId("", "approve-order")).toBe("");
  });
});
