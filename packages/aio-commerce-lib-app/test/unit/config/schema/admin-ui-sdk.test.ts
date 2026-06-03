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

import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { AdminUiSchema, hasAdminUi } from "#config/schema/admin-ui-sdk";
import {
  configWithAdminUiSdk,
  configWithFullAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

function parse(adminUi: unknown) {
  return v.safeParse(AdminUiSchema, adminUi);
}

describe("hasAdminUi", () => {
  test("returns true for configWithAdminUiSdk", () => {
    expect(hasAdminUi(configWithAdminUiSdk)).toBe(true);
  });

  test("returns false for minimalValidConfig", () => {
    expect(hasAdminUi(minimalValidConfig)).toBe(false);
  });

  test("returns false when adminUi is undefined", () => {
    const config: CommerceAppConfigOutputModel = { ...minimalValidConfig };
    expect(hasAdminUi(config)).toBe(false);
  });
});

describe("AdminUiSchema", () => {
  describe("valid cases", () => {
    test("empty object — all fields optional", () => {
      const result = parse({});
      expect(result.success).toBe(true);
    });

    test("only menuItems", () => {
      const result = parse({
        menuItems: [{ id: "app::item", title: "Item" }],
      });
      expect(result.success).toBe(true);
    });

    test("view mass action with path and sandbox", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              sandbox: "allow-modals",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("worker mass action with runtimeAction and timeout", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "my-pkg/my-action",
              timeout: 30,
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("selectionLimit valid on order", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              selectionLimit: 5,
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("selectionLimit valid on product", () => {
      const result = parse({
        product: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              selectionLimit: 5,
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("selectionLimit valid on customer", () => {
      const result = parse({
        customer: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "pkg/action",
              selectionLimit: 5,
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("optional notifications field parses", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "pkg/action",
              notifications: { success: "Done!", error: "Failed!" },
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("optional installation field parses", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              installation: {
                label: "Install it",
                description: "Installs the action",
              },
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("optional confirm and title fields parse", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              title: "Page Title",
              confirm: { title: "Confirm?", message: "Are you sure?" },
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("configWithAdminUiSdk.adminUi fixture parses", () => {
      const result = parse(configWithAdminUiSdk.adminUi);
      expect(result.success).toBe(true);
    });

    test("configWithFullAdminUiSdk.adminUi fixture parses", () => {
      const result = parse(configWithFullAdminUiSdk.adminUi);
      expect(result.success).toBe(true);
    });

    test("grid columns — all 5 type values", () => {
      for (const type of [
        "boolean",
        "date",
        "float",
        "integer",
        "string",
      ] as const) {
        const result = parse({
          order: {
            gridColumns: {
              data: { meshId: "mesh-1" },
              properties: [
                { label: "Col", columnId: "col", type, align: "left" },
              ],
            },
          },
        });
        expect(result.success, `type "${type}" should be valid`).toBe(true);
      }
    });

    test("view buttons — level -1, 0, 1", () => {
      for (const level of [-1, 0, 1] as const) {
        const result = parse({
          order: {
            viewButtons: [
              { buttonId: "app::btn", label: "Btn", path: "#/btn", level },
            ],
          },
        });
        expect(result.success, `level ${level} should be valid`).toBe(true);
      }
    });

    test("iframe-enabled view button allows sandbox", () => {
      const result = parse({
        order: {
          viewButtons: [
            {
              buttonId: "app::btn",
              label: "Btn",
              path: "#/btn",
              displayIframe: true,
              sandbox: "allow-modals",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("bannerNotification with only orderViewButtons (no massActions)", () => {
      const result = parse({
        bannerNotification: {
          orderViewButtons: [
            {
              buttonId: "app::btn",
              successMessage: "Done!",
              errorMessage: "Failed!",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid cases — variant enforcement", () => {
    test("view with runtimeAction — fails (field belongs to worker)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              runtimeAction: "pkg/action",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("view without path — fails (required field)", () => {
      const result = parse({
        order: {
          massActions: [{ actionId: "action", label: "Action", type: "view" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("view with timeout — fails (field belongs to worker)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              timeout: 30,
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("worker with path — fails (field belongs to view)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "pkg/action",
              path: "#/action",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("view with displayIframe — fails (v1 field removed from mass actions)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              displayIframe: false,
              sandbox: "allow-modals",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("worker with sandbox — fails (field belongs to view)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "pkg/action",
              sandbox: "allow-modals",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("worker without runtimeAction — fails (required field)", () => {
      const result = parse({
        order: {
          massActions: [
            { actionId: "action", label: "Action", type: "worker" },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing type — fails", () => {
      const result = parse({
        order: {
          massActions: [
            { actionId: "action", label: "Action", path: "#/action" },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("productSelectLimit — fails (old field name, strictObject)", () => {
      const result = parse({
        product: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              productSelectLimit: 5,
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("customerSelectLimit — fails (old field name, strictObject)", () => {
      const result = parse({
        customer: {
          massActions: [
            {
              actionId: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "pkg/action",
              customerSelectLimit: 5,
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing actionId — fails", () => {
      const result = parse({
        order: {
          massActions: [{ label: "Action", type: "view", path: "#/action" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing label — fails", () => {
      const result = parse({
        order: {
          massActions: [{ actionId: "action", type: "view", path: "#/action" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid column type not in allowed list — fails", () => {
      const result = parse({
        order: {
          gridColumns: {
            data: { meshId: "mesh-1" },
            properties: [
              { label: "Col", columnId: "col", type: "text", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid column align not in allowed list — fails", () => {
      const result = parse({
        order: {
          gridColumns: {
            data: { meshId: "mesh-1" },
            properties: [
              {
                label: "Col",
                columnId: "col",
                type: "string",
                align: "justify",
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid columns with empty properties array — fails (minLength 1)", () => {
      const result = parse({
        order: {
          gridColumns: {
            data: { meshId: "mesh-1" },
            properties: [],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("view button level not in allowed list — fails", () => {
      const result = parse({
        order: {
          viewButtons: [
            { buttonId: "app::btn", label: "Btn", path: "#/btn", level: 2 },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("view button sandbox without displayIframe true — fails", () => {
      const result = parse({
        order: {
          viewButtons: [
            {
              buttonId: "app::btn",
              label: "Btn",
              path: "#/btn",
              displayIframe: false,
              sandbox: "allow-modals",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("menu item with empty id string — fails", () => {
      const result = parse({
        menuItems: [{ id: "", title: "Item" }],
      });
      expect(result.success).toBe(false);
    });

    test("custom fee missing required value — fails", () => {
      const result = parse({
        order: {
          customFees: [{ id: "app::fee", label: "Fee" }],
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
