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

import type { BusinessConfigSchema } from "#modules/schema/types";

export const VALID_CONFIGURATION = [
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
  {
    name: "url",
    type: "url",
    label: "URL Field",
  },
  {
    name: "email",
    type: "email",
    label: "Email Field",
  },
  {
    name: "password",
    type: "password",
    label: "Password Field",
  },
  {
    name: "telephone",
    type: "tel",
    label: "Telephone Field",
  },
  {
    name: "url",
    type: "url",
    label: "URL Field",
    default: "https://example.com",
  },
  {
    name: "email",
    type: "email",
    label: "Email Field",
    default: "example@example.com",
  },
  {
    name: "password",
    type: "password",
    label: "Password Field",
    default: "",
  },
  {
    name: "telephone",
    type: "tel",
    label: "Telephone Field",
    default: "+1234567890",
  },
  {
    name: "enableFeatureFlag",
    type: "boolean",
    label: "Enable Feature Flag",
    default: true,
  },
  {
    name: "optionalToggle",
    type: "boolean",
    label: "Optional Toggle",
  },
  {
    name: "saasOnlyApiKey",
    type: "password",
    label: "SaaS API Key",
    env: ["saas"],
  },
  {
    name: "paasOnlyToken",
    type: "text",
    label: "PaaS Token",
    env: ["paas"],
  },
  {
    name: "bothFlavorsField",
    type: "text",
    label: "Both Flavors Field",
    env: ["paas", "saas"],
  },
] satisfies BusinessConfigSchema;

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

export const VALID_CONFIGURATION_WITHOUT_DEFAULTS = [
  {
    name: "exampleList",
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "single",

    // `list` is the only one always requiring a default because we can't set one programmatically
    default: "option1",
  },
  {
    name: "exampleList",
    type: "list",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "multiple",
  },
  {
    name: "text",
    type: "text",
    label: "Text",
  },
  {
    name: "email",
    type: "email",
    label: "Email",
  },
  {
    name: "telephone",
    type: "tel",
    label: "Telephone",
  },
  {
    type: "url",
    name: "url",
    label: "URL",
  },
  {
    name: "password",
    type: "password",
    label: "Password",
  },
] satisfies BusinessConfigSchema;
