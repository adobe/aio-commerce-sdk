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

import type { BusinessConfigurationConfig } from "@adobe/aio-commerce-lib-extensibility/config";

/** Context needed for schema operations. */
export type SchemaContext = {
  /** The namespace for isolating schema data. */
  namespace: string;

  /** Cache timeout in milliseconds. */
  cacheTimeout: number;
};

/** The schema type for the business configuration schema. */
export type ConfigSchemaField = NonNullable<
  BusinessConfigurationConfig["schema"]
>[number];

export type {
  BusinessConfigurationConfig,
  ExtensibilityConfig,
} from "@adobe/aio-commerce-lib-extensibility/config";
