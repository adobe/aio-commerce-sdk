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

import { AdminUiSdkSchema, hasAdminUiSdk } from "#config/schema/admin-ui-sdk";
import {
  configWithAdminUiSdk,
  configWithFullAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

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

    test("registration with order mass actions including selectionLimit", () => {
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
  });
});
