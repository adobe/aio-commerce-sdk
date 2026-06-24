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

import { getMenuAclResourceId } from "#menu/acl-resource-id";

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
