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
  { id: 1, name: "Main Website", code: "base", default_group_id: 1 },
  { id: 2, name: "Second Website", code: "second", default_group_id: 2 },
];

export const mockStoreGroups: StoreGroup[] = [
  {
    id: 1,
    website_id: 1,
    name: "Main Store",
    code: "main_store",
    root_category_id: 2,
    default_store_id: 1,
  },
];

export const mockStoreViews: StoreView[] = [
  {
    id: 1,
    code: "default",
    name: "Default Store View",
    website_id: 1,
    store_group_id: 1,
    is_active: true,
  },
];
