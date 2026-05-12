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

import type {
  BusinessConfigSchema,
  MaybeDynamicBusinessConfigSchema,
} from "@adobe/aio-commerce-lib-config";

/** Schema with a single list field whose options are a static array. */
export const schemaWithStaticListOptions = [
  {
    name: "paymentMethod",
    type: "list",
    selectionMode: "single",
    default: "braintree",
    options: [{ label: "Braintree", value: "braintree" }],
  },
] satisfies BusinessConfigSchema;

/** Schema with a single list field whose options are resolved at runtime via a factory. */
export const schemaWithDynamicListOptions = [
  {
    name: "paymentMethod",
    type: "list",
    selectionMode: "single",
    default: "braintree",
    options: () => [{ label: "Braintree", value: "braintree" }],
  },
] satisfies MaybeDynamicBusinessConfigSchema;
