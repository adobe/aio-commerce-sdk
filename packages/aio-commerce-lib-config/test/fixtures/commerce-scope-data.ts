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

import type { StoreGroup, StoreView, Website } from "#types/index";

export const mockWebsites: Website[] = [
  { code: "base", default_group_id: 1, id: 1, name: "Main Website" },
  { code: "second", default_group_id: 2, id: 2, name: "Second Website" },
];

export const mockStoreGroups: StoreGroup[] = [
  {
    code: "main_store",
    default_store_id: 1,
    id: 1,
    name: "Main Store",
    root_category_id: 2,
    website_id: 1,
  },
];

export const mockStoreViews: StoreView[] = [
  {
    code: "default",
    id: 1,
    is_active: true,
    name: "Default Store View",
    store_group_id: 1,
    website_id: 1,
  },
];
