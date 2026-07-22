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

import type { ScopeTree } from "#modules/scope-tree/types";

/**
 * Mock scope tree for testing.
 */
export const mockScopeTree: ScopeTree = [
  {
    code: "global",
    id: "id-global",
    is_editable: false,
    is_final: true,
    is_removable: false,
    label: "Global",
    level: "global",
  },
  {
    children: [
      {
        children: [
          {
            children: [
              {
                code: "default",
                commerce_id: 1,
                id: "idsv",
                is_editable: true,
                is_final: false,
                is_removable: false,
                label: "Default Store View",
                level: "store_view",
              },
            ],
            code: "main_store",
            commerce_id: 1,
            id: "ids",
            is_editable: true,
            is_final: false,
            is_removable: false,
            label: "Main Store",
            level: "store",
          },
        ],
        code: "base",
        commerce_id: 1,
        id: "idw",
        is_editable: true,
        is_final: false,
        is_removable: false,
        label: "Base",
        level: "website",
      },
    ],
    code: "commerce",
    id: "id-commerce",
    is_editable: false,
    is_final: true,
    is_removable: false,
    label: "Commerce",
    level: "commerce",
  },

  // Default level when using `byCode` is `base`. For tests to be able to test
  // any path using the above selector we need a scope with that level
  {
    code: "base_region",
    id: "id-base-region",
    is_editable: true,
    is_final: true,
    is_removable: true,
    label: "Base Region",
    level: "base",
  },
];
