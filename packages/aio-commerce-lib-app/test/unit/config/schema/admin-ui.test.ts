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
  });

  describe("order.viewButtons", () => {
    const viewBase = {
      type: "view" as const,
      id: "delete-order",
      label: "Delete",
      path: "#/delete-order",
    };

    const workerBase = {
      type: "worker" as const,
      id: "sync-inventory",
      label: "Sync inventory",
      runtimeAction: "orders/sync-inventory",
    };

    describe("valid cases", () => {
      test("type: view with required fields only", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [viewBase] },
        });
        expect(result.success).toBe(true);
      });

      test("type: worker with required fields only", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [workerBase] },
        });
        expect(result.success).toBe(true);
      });

      test("type: view with all optional fields", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              {
                ...viewBase,
                description: "Permanently removes the order.",
                level: 0,
                sortOrder: 80,
                sandboxPermissions: ["allow-modals", "allow-popups"],
                confirm: { message: "Are you sure?" },
                notifications: {
                  success: "Done.",
                  error: "Failed.",
                },
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
                ...workerBase,
                description: "Pushes stock counts.",
                level: 1,
                sortOrder: 10,
                timeout: 15,
                confirm: { message: "Sync now?" },
                notifications: {
                  success: "Synced.",
                  error: "Sync failed.",
                },
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
              viewButtons: [{ ...viewBase, sandboxPermissions: [perm] }],
            },
          });
          expect(result.success, `"${perm}" should be valid`).toBe(true);
        }
      });

      test("notifications with only success", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...workerBase, notifications: { success: "Done." } },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("notifications with only error", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...workerBase, notifications: { error: "Failed." } },
            ],
          },
        });
        expect(result.success).toBe(true);
      });

      test("gridColumns and viewButtons can coexist on order", () => {
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
            viewButtons: [workerBase],
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe("invalid cases", () => {
      test("type: view with runtimeAction is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [{ ...viewBase, runtimeAction: "orders/delete" }],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: view with timeout is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [{ ...viewBase, timeout: 10 }] },
        });
        expect(result.success).toBe(false);
      });

      test("type: view missing path is rejected", () => {
        const { path: _, ...withoutPath } = viewBase;
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [withoutPath] },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker with path is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [{ ...workerBase, path: "#/something" }],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker with sandboxPermissions is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...workerBase, sandboxPermissions: ["allow-modals"] },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("type: worker missing runtimeAction is rejected", () => {
        const { runtimeAction: _, ...withoutAction } = workerBase;
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [withoutAction] },
        });
        expect(result.success).toBe(false);
      });

      test("empty notifications.success string is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [{ ...workerBase, notifications: { success: "" } }],
          },
        });
        expect(result.success).toBe(false);
      });

      test("invalid sandboxPermissions value is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: {
            viewButtons: [
              { ...viewBase, sandboxPermissions: ["allow-scripts"] },
            ],
          },
        });
        expect(result.success).toBe(false);
      });

      test("invalid level value is rejected", () => {
        const result = v.safeParse(AdminUiSchema, {
          order: { viewButtons: [{ ...viewBase, level: 2 }] },
        });
        expect(result.success).toBe(false);
      });
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
