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
  configWithAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("hasAdminUi", () => {
  test("returns true for configWithAdminUi", () => {
    expect(hasAdminUi(configWithAdminUi)).toBe(true);
  });

  test("returns false for minimalValidConfig", () => {
    expect(hasAdminUi(minimalValidConfig)).toBe(false);
  });

  test("returns false for configWithAdminUiSdk (different key)", () => {
    expect(hasAdminUi(configWithAdminUiSdk)).toBe(false);
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
              columns: [{ columnId: "col", label: "Col", type, align: "left" }],
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
              { columnId: "col", label: "Col", type: "string", align: "left" },
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
                columnId: "col_a",
                label: "Col A",
                type: "string",
                align: "left",
              },
              {
                columnId: "col_b",
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

  describe("invalid cases", () => {
    test("float type is rejected", () => {
      const result = v.safeParse(AdminUiSchema, {
        order: {
          gridColumns: {
            label: "Order grid",
            description: "Adds a column",
            runtimeAction: "orders/fetch",
            columns: [
              { columnId: "col", label: "Col", type: "float", align: "left" },
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
                columnId: "col",
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
              { columnId: "col", label: "Col", type: "string", align: "left" },
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
              { columnId: "col", label: "Col", type: "string", align: "left" },
            ],
          },
        },
      });
      expect(result.success).toBe(false);
    });

    test("missing columnId on column is rejected", () => {
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
