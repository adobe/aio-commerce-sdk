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

import {
  AdminUiSchema,
  AdminUiSdkSchema,
  hasAdminUi,
  hasAdminUiSdk,
} from "#config/schema/admin-ui-sdk";
import {
  configWithAdminUiSdk,
  configWithAdminUiV2,
  configWithFullAdminUiSdk,
  configWithFullAdminUiV2,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

function parseRegistration(registration: unknown) {
  return v.safeParse(AdminUiSdkSchema, { registration });
}

function parse(adminUi: unknown) {
  return v.safeParse(AdminUiSchema, adminUi);
}

describe("hasAdminUiSdk", () => {
  test("returns true for configWithAdminUiSdk", () => {
    expect(hasAdminUiSdk(configWithAdminUiSdk)).toBe(true);
  });

  test("returns false for minimalValidConfig", () => {
    expect(hasAdminUiSdk(minimalValidConfig)).toBe(false);
  });

  test("returns false when adminUiSdk is undefined", () => {
    const config: CommerceAppConfigOutputModel = { ...minimalValidConfig };
    expect(hasAdminUiSdk(config)).toBe(false);
  });

  test("returns false when registration is missing", () => {
    const config = {
      ...minimalValidConfig,
      adminUiSdk: {},
    } as CommerceAppConfigOutputModel;
    expect(hasAdminUiSdk(config)).toBe(false);
  });
});

describe("hasAdminUi", () => {
  test("returns true for configWithAdminUiSdk", () => {
    expect(hasAdminUi(configWithAdminUiV2)).toBe(true);
  });

  test("returns false for minimalValidConfig", () => {
    expect(hasAdminUi(minimalValidConfig)).toBe(false);
  });

  test("returns false when adminUi is undefined", () => {
    const config: CommerceAppConfigOutputModel = { ...minimalValidConfig };
    expect(hasAdminUi(config)).toBe(false);
  });
});

describe("AdminUiSdkSchema", () => {
  describe("valid cases", () => {
    test("empty registration — all fields optional", () => {
      const result = v.safeParse(AdminUiSdkSchema, { registration: {} });
      expect(result.success).toBe(true);
    });

    test("registration with only menuItems", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          menuItems: [{ id: "app::item", title: "Item" }],
        },
      });
      expect(result.success).toBe(true);
    });

    test("order mass action with selectionLimit", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                selectionLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("product mass action with productSelectLimit", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          product: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                productSelectLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("customer mass action with customerSelectLimit", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          customer: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                customerSelectLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("iframe-enabled mass action allows sandbox", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                displayIframe: true,
                sandbox: "allow-modals",
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("registration with grid columns — all 5 type values", () => {
      for (const type of [
        "boolean",
        "date",
        "float",
        "integer",
        "string",
      ] as const) {
        const result = v.safeParse(AdminUiSdkSchema, {
          registration: {
            order: {
              gridColumns: {
                data: { meshId: "mesh-1" },
                properties: [
                  { label: "Col", columnId: "col", type, align: "left" },
                ],
              },
            },
          },
        });
        expect(result.success, `type "${type}" should be valid`).toBe(true);
      }
    });

    test("registration with view buttons — level -1, 0, 1", () => {
      for (const level of [-1, 0, 1] as const) {
        const result = v.safeParse(AdminUiSdkSchema, {
          registration: {
            order: {
              viewButtons: [
                {
                  buttonId: "app::btn",
                  label: "Btn",
                  path: "#/btn",
                  level,
                },
              ],
            },
          },
        });
        expect(result.success, `level ${level} should be valid`).toBe(true);
      }
    });

    test("iframe-enabled view button allows sandbox", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
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
        },
      });
      expect(result.success).toBe(true);
    });

    test("registration with custom fees including applyFeeOnLastCreditMemo", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            customFees: [
              {
                id: "app::fee",
                label: "Fee",
                value: 10.0,
                applyFeeOnLastCreditMemo: true,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("full config from configWithAdminUiSdk fixture", () => {
      const result = v.safeParse(
        AdminUiSdkSchema,
        configWithAdminUiSdk.adminUiSdk,
      );
      expect(result.success).toBe(true);
    });

    test("full config from configWithFullAdminUiSdk fixture", () => {
      const result = v.safeParse(
        AdminUiSdkSchema,
        configWithFullAdminUiSdk.adminUiSdk,
      );
      expect(result.success).toBe(true);
    });
  });

  describe("invalid cases", () => {
    test("mass action missing required actionId — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [{ label: "Action", path: "#/action" }],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("mass action missing required label — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [{ actionId: "app::action", path: "#/action" }],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("mass action missing required path — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [{ actionId: "app::action", label: "Action" }],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid column type not in allowed list — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            gridColumns: {
              data: { meshId: "mesh-1" },
              properties: [
                { label: "Col", columnId: "col", type: "text", align: "left" },
              ],
            },
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid column align not in allowed list — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
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
        },
      });
      expect(result.success).toBe(false);
    });

    test("grid columns with empty properties array — parse fails (minLength 1)", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            gridColumns: {
              data: { meshId: "mesh-1" },
              properties: [],
            },
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("view button level not in allowed list — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            viewButtons: [
              {
                buttonId: "app::btn",
                label: "Btn",
                path: "#/btn",
                level: 2,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("menu item with empty id string — parse fails (nonEmptyStringValueSchema)", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          menuItems: [{ id: "", title: "Item" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("custom fee missing required value — parse fails", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            customFees: [{ id: "app::fee", label: "Fee" }],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("product mass action with selectionLimit — parse fails (use productSelectLimit)", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          product: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                selectionLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("customer mass action with selectionLimit — parse fails (use customerSelectLimit)", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          customer: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                selectionLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("order mass action with productSelectLimit — parse fails (use selectionLimit)", () => {
      const result = v.safeParse(AdminUiSdkSchema, {
        registration: {
          order: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                productSelectLimit: 5,
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("iframe action sandbox without displayIframe true — parse fails", () => {
      const registrations = [
        {
          order: {
            massActions: [
              {
                actionId: "app::action",
                label: "Action",
                path: "#/action",
                sandbox: "allow-modals",
              },
            ],
          },
        },
        {
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
        },
      ];

      for (const registration of registrations) {
        const result = parseRegistration(registration);

        expect(result.success).toBe(false);
      }
    });
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
              id: "action",
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
              id: "action",
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
              id: "action",
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
              id: "action",
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
              id: "action",
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
              id: "action",
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

    test("optional description field parses (flat, no installation nesting)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              description: "Installs the action",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("installation nesting — fails (rejected in v2; use flat description)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              installation: { label: "Install it" },
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test("optional confirm and title fields parse", () => {
      const result = parse({
        order: {
          massActions: [
            {
              id: "action",
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
      const result = parse(configWithAdminUiV2.adminUi);
      expect(result.success).toBe(true);
    });

    test("configWithFullAdminUiSdk.adminUi fixture parses", () => {
      const result = parse(configWithFullAdminUiV2.adminUi);
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
              id: "action",
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
          massActions: [{ id: "action", label: "Action", type: "view" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("view with timeout — fails (field belongs to worker)", () => {
      const result = parse({
        order: {
          massActions: [
            {
              id: "action",
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
              id: "action",
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
              id: "action",
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
              id: "action",
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
          massActions: [{ id: "action", label: "Action", type: "worker" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing type — fails", () => {
      const result = parse({
        order: {
          massActions: [{ id: "action", label: "Action", path: "#/action" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("productSelectLimit — fails (old field name, strictObject)", () => {
      const result = parse({
        product: {
          massActions: [
            {
              id: "action",
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
              id: "action",
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

    test("missing id — fails", () => {
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
          massActions: [{ id: "action", type: "view", path: "#/action" }],
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
