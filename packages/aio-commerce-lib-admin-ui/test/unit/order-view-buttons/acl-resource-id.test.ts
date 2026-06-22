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

import { getOrderViewButtonAclResourceId } from "#order-view-buttons/acl-resource-id";

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
    expect(getOrderViewButtonAclResourceId("   ", "approve-order")).toBe("");
  });
});
