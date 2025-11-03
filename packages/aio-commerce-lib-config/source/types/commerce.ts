/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Note: CommerceHttpClientConfig and CommerceHttpClientParams are defined in internal.ts
// to avoid circular dependencies with LibConfig

// Commerce API response types
export type CommerceScopeData = {
  websites: Website[];
  storeGroups: StoreGroup[];
  storeViews: StoreView[];
};

export type Website = {
  id: number;
  name: string;
  code: string;
  default_group_id: number;
  extension_attributes?: Record<string, unknown>;
};

export type StoreGroup = {
  id: number;
  website_id: number;
  root_category_id: number;
  default_store_id: number;
  name: string;
  code: string;
  extension_attributes?: Record<string, unknown>;
};

export type StoreView = {
  id: number;
  code: string;
  name: string;
  website_id: number;
  store_group_id: number;
  is_active: boolean;
  extension_attributes?: Record<string, unknown>;
};
