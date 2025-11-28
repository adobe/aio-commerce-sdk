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

import type { BusinessConfigSchema } from "#modules/schema/schema";

export const VALID_CONFIGURATION: BusinessConfigSchema = [
  {
    name: "exampleList",
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    default: "option1",
    selectionMode: "single",
  },
  {
    name: "exampleList",
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    default: ["option1"],
    selectionMode: "multiple",
  },
  {
    name: "currency",
    type: "text",
    label: "Currency",
  },
  {
    name: "paymentMethod",
    type: "text",
    label: "Payment Test Method",
  },
  {
    name: "testField",
    type: "text",
    label: "Test Field",
  },
];

export const INVALID_CONFIGURATION = [
  {
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    default: "option1",
  },
  {
    type: "text",
    label: "Currency",
  },
  {
    type: "text",
    label: "Payment Test Method",
  },
  {
    type: "text",
    label: "Test Field",
  },
];
