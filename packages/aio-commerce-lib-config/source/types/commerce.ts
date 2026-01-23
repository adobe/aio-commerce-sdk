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

/**
 * Commerce API response data containing websites, store groups, and store views.
 *
 * This type represents the structure of scope data returned from the Adobe Commerce API
 * when fetching scope information.
 */
export type CommerceScopeData = {
  /** Array of website definitions. */
  websites: Website[];
  /** Array of store group definitions. */
  storeGroups: StoreGroup[];
  /** Array of store view definitions. */
  storeViews: StoreView[];
};

/**
 * Represents a website in Adobe Commerce.
 */
export type Website = {
  /** Unique identifier for the website. */
  id: number;
  /** Display name of the website. */
  name: string;
  /** Unique code identifier for the website. */
  code: string;
  /** ID of the default store group for this website. */
  default_group_id: number;
  /** Optional extension attributes for additional data. */
  extension_attributes?: Record<string, unknown>;
};

/**
 * Represents a store group in Adobe Commerce.
 */
export type StoreGroup = {
  /** Unique identifier for the store group. */
  id: number;
  /** ID of the parent website. */
  website_id: number;
  /** Root category ID for this store group. */
  root_category_id: number;
  /** ID of the default store for this store group. */
  default_store_id: number;
  /** Display name of the store group. */
  name: string;
  /** Unique code identifier for the store group. */
  code: string;
  /** Optional extension attributes for additional data. */
  extension_attributes?: Record<string, unknown>;
};

/**
 * Represents a store view in Adobe Commerce.
 */
export type StoreView = {
  /** Unique identifier for the store view. */
  id: number;
  /** Unique code identifier for the store view. */
  code: string;
  /** Display name of the store view. */
  name: string;
  /** ID of the parent website. */
  website_id: number;
  /** ID of the parent store group. */
  store_group_id: number;
  /** Whether the store view is currently active. */
  is_active: boolean;
  /** Optional extension attributes for additional data. */
  extension_attributes?: Record<string, unknown>;
};
