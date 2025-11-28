/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { ScopeTree } from "#modules/scope-tree";

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
