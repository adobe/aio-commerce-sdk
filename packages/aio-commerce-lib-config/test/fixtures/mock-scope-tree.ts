import type { ScopeTree } from "../../source/modules/scope-tree";

/**
 * Mock scope tree for testing.
 */
export const mockScopeTree: ScopeTree = [
  {
    id: "id-global",
    code: "global",
    label: "Global",
    level: "global",
    is_editable: false,
    is_removable: false,
    is_final: true,
  },
  {
    id: "id-commerce",
    code: "commerce",
    label: "Commerce",
    level: "commerce",
    is_editable: false,
    is_removable: false,
    is_final: true,
    children: [
      {
        id: "idw",
        code: "base",
        label: "Base",
        level: "website",
        is_editable: true,
        is_removable: false,
        is_final: false,
        children: [
          {
            id: "ids",
            code: "main_store",
            label: "Main Store",
            level: "store",
            is_editable: true,
            is_removable: false,
            is_final: false,
            children: [
              {
                id: "idsv",
                code: "default",
                label: "Default Store View",
                level: "store_view",
                is_editable: true,
                is_removable: false,
                is_final: false,
              },
            ],
          },
        ],
      },
    ],
  },
];
