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
  viewButtonViewBase,
  viewButtonWorkerBase,
} from "#test/fixtures/admin-ui";
import {
  configWithAdminUiAllGrids,
  configWithAdminUiMenu,
  configWithFullAdminUiV2,
  configWithViewMassActions,
  configWithWorkerMassActions,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("hasAdminUi", () => {
  test.each([
    {
      config: configWithAdminUiAllGrids,
      label: "grid columns for all entities",
    },
    { config: configWithAdminUiMenu, label: "menu only" },
    { config: configWithViewMassActions, label: "view mass actions" },
    { config: configWithWorkerMassActions, label: "worker mass actions" },
  ])("returns true when adminUi has $label", ({ config }) => {
    expect(hasAdminUi(config)).toBe(true);
  });

  test.each([{ config: minimalValidConfig, label: "no adminUi property" }])(
    "returns false when config has $label",
    ({ config }) => {
      expect(hasAdminUi(config)).toBe(false);
    },
  );
});

describe("AdminUiSchema", () => {
  describe("valid cases", () => {
    test("grid columns with all 6 column types", () => {
      for (const type of [
        "boolean",
        "date",
        "datetime",
        "float",
        "integer",
        "string",
      ] as const) {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            gridColumns: {
              columns: [{ align: "left", id: "col", label: "Col", type }],
              description: "Adds a column",
              label: "Order grid",
              runtimeAction: "orders/fetch",
            },
          },
        });
        expect(result.success, `type "${type}" should be valid`).toBe(true);
      }
    });

    test("all three grids configured", () => {
      const result = v.safeParse(
        AdminUiSchema,
        configWithAdminUiAllGrids.adminUi,
      );
      expect(result.success).toBe(true);
    });

    test("only one grid configured (others absent)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              { align: "left", id: "col", label: "Col", type: "string" },
            ],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("multiple columns per grid", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              {
                align: "left",
                id: "col_a",
                label: "Col A",
                type: "string",
              },
              {
                align: "right",
                id: "col_b",
                label: "Col B",
                type: "integer",
              },
            ],
            description: "Adds columns",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(true);
    });

    test("menu with required fields only", () => {
      const { id, label, description } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, {
        menu: { description, id, label },
      });

      expect(result.success).toBe(true);
    });

    test("menu with all optional fields", () => {
      const result = v.safeParse(AdminUiSchema, configWithAdminUiMenu.adminUi);
      expect(result.success).toBe(true);
    });

    test("menu aclProtected: true is accepted", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, aclProtected: true },
      });
      expect(result.success).toBe(true);
    });

    test("menu aclProtected: false is accepted", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, aclProtected: false },
      });
      expect(result.success).toBe(true);
    });

    test("menu aclProtected omitted is accepted (optional)", () => {
      const { id, label, description } = configWithAdminUiMenu.adminUi.menu;
      const result = v.safeParse(AdminUiSchema, {
        menu: { description, id, label },
      });
      expect(result.success).toBe(true);
    });

    test("different extension points coexist", () => {
      const result = v.safeParse(
        AdminUiSchema,
        configWithFullAdminUiV2.adminUi,
      );
      expect(result.success).toBe(true);
    });

    test("grid columns and mass actions coexist on the same entity", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              { align: "left", id: "col", label: "Col", type: "string" },
            ],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
          massActions: [
            { id: "action", label: "Action", path: "#/action", type: "view" },
          ],
        },
      });
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

  describe("order.viewButtons", () => {
    describe("valid cases", () => {
      test("type: view with required fields only", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [viewButtonViewBase] },
        });
        expect(result.success).toBe(true);
      });

      test("type: worker with required fields only", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [viewButtonWorkerBase] },
        });
        expect(result.success).toBe(true);
      });

      test("type: view with all optional fields", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              {
                ...viewButtonViewBase,
                confirm: { message: "Are you sure?" },
                description: "Permanently removes the order.",
                level: 0,
                notifications: {
                  error: "Failed.",
                  success: "Done.",
                },
                sandboxPermissions: ["allow-modals", "allow-popups"],
                sortOrder: 80,
              },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("type: worker with all optional fields", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              {
                ...viewButtonWorkerBase,
                confirm: { message: "Sync now?" },
                description: "Pushes stock counts.",
                level: 1,
                notifications: {
                  error: "Sync failed.",
                  success: "Synced.",
                },
                sortOrder: 10,
                timeout: 15,
              },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("all three sandboxPermissions values are valid", () => {
        for (const perm of [
          "allow-downloads",
          "allow-modals",
          "allow-popups",
        ] as const) {
          const result = v.safeParse(AdminUiSchema, {
            order: {
              viewButtons: [
                { ...viewButtonViewBase, sandboxPermissions: [perm] },
              ],
            },
          });
          expect(result.success, `"${perm}" should be valid`).toBe(true);
        }
      });

      test("notifications with only success", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonWorkerBase, notifications: { success: "Done." } },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("notifications with only error", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonWorkerBase, notifications: { error: "Failed." } },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("gridColumns and viewButtons can coexist on order", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            gridColumns: {
              columns: [
                { align: "left", id: "col", label: "Col", type: "string" },
              ],
              description: "Adds a column",
              label: "Order grid",
              runtimeAction: "orders/fetch",
            },
            viewButtons: [viewButtonWorkerBase],
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe("invalid cases", () => {
      test("type: view with runtimeAction is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonViewBase, runtimeAction: "orders/delete" },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: view with timeout is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [{ ...viewButtonViewBase, timeout: 10 }] },
        });
        expect(result.success).toBe(false);
      });

      test("type: view missing path is rejected", () => {
        const { path: _, ...withoutPath } = viewButtonViewBase;
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [withoutPath] },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker with path is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [{ ...viewButtonWorkerBase, path: "#/something" }],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker with sandboxPermissions is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonWorkerBase, sandboxPermissions: ["allow-modals"] },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker missing runtimeAction is rejected", () => {
        const { runtimeAction: _, ...withoutAction } = viewButtonWorkerBase;
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [withoutAction] },
        });
        expect(result.success).toBe(false);
      });

      test("empty notifications.success string is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonWorkerBase, notifications: { success: "" } },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("invalid sandboxPermissions value is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewButtonViewBase, sandboxPermissions: ["allow-scripts"] },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("invalid level value is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [{ ...viewButtonViewBase, level: 2 }] },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("invalid cases", () => {
    test("decimal type is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              { align: "left", id: "col", label: "Col", type: "decimal" },
            ],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("invalid align value is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              {
                align: "justify",
                id: "col",
                label: "Col",
                type: "string",
              },
            ],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("empty columns array is rejected (minLength 1)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing label on gridColumns is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              { align: "left", id: "col", label: "Col", type: "string" },
            ],
            description: "Adds a column",
            runtimeAction: "orders/fetch",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing runtimeAction is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [
              { align: "left", id: "col", label: "Col", type: "string" },
            ],
            description: "Adds a column",
            label: "Order grid",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing id on column is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            columns: [{ align: "left", label: "Col", type: "string" }],
            description: "Adds a column",
            label: "Order grid",
            runtimeAction: "orders/fetch",
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

    test.each(["with space", "with-dash", "with@at", "with.dot"])(
      "invalid menu id %s is rejected",
      (id) => {
        const result = v.safeParse(AdminUiSchema, {
          menu: { ...configWithAdminUiMenu.adminUi.menu, id },
        });
        expect(result.success, `id "${id}" should be rejected`).toBe(false);
      },
    );

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

    test("menu aclProtected: 'yes' (non-boolean string) is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, aclProtected: "yes" },
      });
      expect(result.success).toBe(false);
    });

    test("menu aclProtected: 1 (number) is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        menu: { ...configWithAdminUiMenu.adminUi.menu, aclProtected: 1 },
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
              path: "#/action",
              sandboxPermissions: ["allow-modals"],
              type: "view",
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
              runtimeAction: "my-pkg/my-action",
              type: "worker",
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    test("configWithAdminUiV2 fixture parses", () => {
      const result = v.safeParse(
        AdminUiSchema,
        configWithViewMassActions.adminUi,
      );
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
              path: "#/action",
              runtimeAction: "pkg/action",
              type: "view",
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
              path: "#/action",
              runtimeAction: "pkg/action",
              type: "worker",
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

    test("view mass action with timeout field is rejected (strict)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              path: "#/action",
              timeout: 30,
              type: "view",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test.each([
      { label: "invalid permission value", value: ["allow-scripts"] },
      {
        label: "duplicate permissions",
        value: ["allow-popups", "allow-popups"],
      },
      { label: "empty permissions array", value: [] },
    ])(
      "view mass action sandboxPermissions rejected when $label",
      ({ value }) => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            massActions: [
              {
                id: "action",
                label: "Action",
                path: "#/action",
                sandboxPermissions: value,
                type: "view",
              },
            ],
          },
        });
        expect(result.success).toBe(false);
      },
    );

    test("worker mass action with sandboxPermissions is rejected (strict)", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          massActions: [
            {
              id: "action",
              label: "Action",
              runtimeAction: "pkg/action",
              sandboxPermissions: ["allow-popups"],
              type: "worker",
            },
          ],
        },
      });
      expect(result.success).toBe(false);
    });

    test.each([{ label: "negative", timeout: -1 }])(
      "worker mass action with $label timeout is rejected",
      ({ timeout }) => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            massActions: [
              {
                id: "action",
                label: "Action",
                runtimeAction: "pkg/action",
                timeout,
                type: "worker",
              },
            ],
          },
        });
        expect(result.success).toBe(false);
      },
    );

    test.each([
      {
        label: "empty confirm.message",
        massAction: {
          confirm: { message: "" },
          id: "a",
          label: "A",
          path: "#/a",
          type: "view" as const,
        },
      },
      {
        label: "empty notifications.success",
        massAction: {
          id: "a",
          label: "A",
          notifications: { success: "" },
          path: "#/a",
          type: "view" as const,
        },
      },
      {
        label: "negative selectionLimit",
        massAction: {
          id: "a",
          label: "A",
          path: "#/a",
          selectionLimit: -1,
          type: "view" as const,
        },
      },
    ])("mass action with $label is rejected", ({ massAction }) => {
      const result = v.safeParse(AdminUiSchema, {
        order: { massActions: [massAction] },
      });
      expect(result.success).toBe(false);
    });
  });
});
