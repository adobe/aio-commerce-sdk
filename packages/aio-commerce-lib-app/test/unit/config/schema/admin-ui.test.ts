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

import { AdminUiSchema, hasAdminUi } from "#config/schema/admin-ui";
import {
  configWithAdminUi,
  configWithAdminUiMenu,
  configWithAdminUiV2,
  configWithFullAdminUiV2,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("hasAdminUi", () => {
  test("returns true for configWithAdminUi", () => {
    expect(hasAdminUi(configWithAdminUi)).toBe(true);
  });

  test("returns true for configWithAdminUiV2", () => {
    expect(hasAdminUi(configWithAdminUiV2)).toBe(true);
  });

  test("returns true for configWithAdminUiMenu", () => {
    expect(hasAdminUi(configWithAdminUiMenu)).toBe(true);
  });

  test("returns false for minimalValidConfig", () => {
    expect(hasAdminUi(minimalValidConfig)).toBe(false);
  });
});

describe("AdminUiSchema", () => {
  describe("valid cases", () => {
    test("grid columns with all 6 column types", () => {
      for (const type of [
        "boolean",
        "date",
        "datetime",
        "decimal",
        "integer",
        "string",
      ] as const) {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            gridColumns: {
              label: "Order grid",
              description: "Adds a column",
              runtimeAction: "orders/fetch",
              columns: [{ id: "col", label: "Col", type, align: "left" }],
            },
          },
        });
        expect(result.success, `type "${type}" should be valid`).toBe(true);
      }
    });

    test("all three grids configured", () => {
      const result = v.safeParse(AdminUiSchema, configWithAdminUi.adminUi);
      expect(result.success).toBe(true);
    });

    test("only one grid configured (others absent)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [
              { id: "col", label: "Col", type: "string", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("multiple columns per grid", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds columns",
            runtimeAction: "orders/fetch",
            columns: [
              {
                id: "col_a",
                label: "Col A",
                type: "string",
                align: "left",
              },
              {
                id: "col_b",
                label: "Col B",
                type: "integer",
                align: "right",
              },
            ],
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("menu with required fields only", () => {
      const { id, label, description } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, {
        menu: { id, label, description },
      });

      expect(result.success).toBe(true);
    });

    test("menu with all optional fields", () => {
      const result = v.safeParse(AdminUiSchema, configWithAdminUiMenu.adminUi);
      expect(result.success).toBe(true);
    });

    test("different extension points coexist", () => {
      const result = v.safeParse(AdminUiSchema, configWithAdminUi.adminUi);
      expect(result.success).toBe(true);
    });

    test.each([
      "letters_only",
      "with/slash",
      "with:colon",
      "With_Mixed/Case:123",
    ])("valid menu id %s is accepted", (id) => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, id },
      });
      expect(result.success, `id "${id}" should be valid`).toBe(true);
    });
  });

  describe("invalid cases", () => {
    test("float type is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [
              { id: "col", label: "Col", type: "float", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("invalid align value is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [
              {
                id: "col",
                label: "Col",
                type: "string",
                align: "justify",
              },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("empty columns array is rejected (minLength 1)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing label on gridColumns is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [
              { id: "col", label: "Col", type: "string", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing runtimeAction is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            columns: [
              { id: "col", label: "Col", type: "string", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing id on column is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [{ label: "Col", type: "string", align: "left" }],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing menu id is rejected", () => {
      const { id: _, ...noId } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, { menu: noId });
      expect(result.success).toBe(false);
    });

    test("missing menu label is rejected", () => {
      const { label: _, ...noLabel } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, { menu: noLabel });
      expect(result.success).toBe(false);
    });

    test("missing menu description is rejected", () => {
      const { description: _, ...noDesc } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, { menu: noDesc });
      expect(result.success).toBe(false);
    });

    test.each([
      "with space",
      "with-dash",
      "with@at",
      "with.dot",
    ])("invalid menu id %s is rejected", (id) => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, id },
      });
      expect(result.success, `id "${id}" should be rejected`).toBe(false);
    });

    test("empty menu id is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, id: "" },
      });
      expect(result.success).toBe(false);
    });

    test("empty menu label is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, label: "" },
      });
      expect(result.success).toBe(false);
    });

    test("empty menu description is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, description: "" },
      });
      expect(result.success).toBe(false);
    });

    test("empty pageTitle is rejected when provided", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, pageTitle: "" },
      });
      expect(result.success).toBe(false);
    });

    test("unknown parentMenu is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: {
          ...configWithAdminUiMenu.adminUi.menu,
          parentMenu: "unknown.menu",
        },
      });
      expect(result.success).toBe(false);
    });

    test("invalid sandboxPermissions value is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: {
          ...configWithAdminUiMenu.adminUi.menu,
          sandboxPermissions: ["allow-scripts"],
        },
      });
      expect(result.success).toBe(false);
    });

    test("duplicate sandboxPermissions values are rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: {
          ...configWithAdminUiMenu.adminUi.menu,
          sandboxPermissions: ["allow-popups", "allow-popups"],
        },
      });

      expect(result.success).toBe(false);
    });

    test("empty sandboxPermissions array is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, sandboxPermissions: [] },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("AdminUiSchema — mass actions", () => {
  describe("valid cases", () => {
    test("view mass action with path and sandboxPermissions parses successfully", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              type: "view",
              path: "#/action",
              sandboxPermissions: ["allow-modals"],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("worker mass action with runtimeAction parses successfully", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              type: "worker",
              runtimeAction: "my-pkg/my-action",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("configWithAdminUiV2 fixture parses", () => {
      const result = v.safeParse(AdminUiSchema, configWithAdminUiV2.adminUi);
      expect(result.success).toBe(true);
    });

    test("configWithFullAdminUiV2 fixture parses", () => {
      const result = v.safeParse(
        AdminUiSchema,
        configWithFullAdminUiV2.adminUi,
      );
      expect(result.success).toBe(true);
    });
  });

  describe("invalid cases", () => {
    test("view mass action with runtimeAction fails (strict, wrong variant)", () => {
      const result = v.safeParse(AdminUiSchema, {
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

    test("worker mass action with path fails (strict, wrong variant)", () => {
      const result = v.safeParse(AdminUiSchema, {
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

    test("view mass action missing path fails", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [{ id: "action", label: "Action", type: "view" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("worker mass action missing runtimeAction fails", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [{ id: "action", label: "Action", type: "worker" }],
        },
      });
      expect(result.success).toBe(false);
    });

    test("mass action missing type fails", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [{ id: "action", label: "Action", path: "#/action" }],
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
