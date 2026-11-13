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

import { getRmaViewButtonAclResourceId } from "#rma-view-buttons/index";

describe("getRmaViewButtonAclResourceId", () => {
  it("produces a return view-button leaf ID", () => {
    expect(getRmaViewButtonAclResourceId("returns-app", "approve-return")).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_returns_app_rma_viewbuttons_approve_return",
    );
  });

  it("trims and sanitizes both segments", () => {
    expect(
      getRmaViewButtonAclResourceId("  My-App  ", "  Approve Return!  "),
    ).toBe(
      "Magento_CommerceBackendUix::adminuisdk_app_my_app_rma_viewbuttons_approve_return_",
    );
  });

  it.each(["", "   "])(
    "returns an empty string for blank metadataId %j",
    (id) => {
      expect(getRmaViewButtonAclResourceId(id, "approve-return")).toBe("");
    },
  );
});
