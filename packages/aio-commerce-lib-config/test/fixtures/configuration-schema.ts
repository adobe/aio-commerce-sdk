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
    default: "option1",
    name: "exampleList",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "single",
    type: "list",
  },
  {
    default: ["option1"],
    name: "exampleList",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "multiple",
    type: "list",
  },
  {
    label: "Currency",
    name: "currency",
    type: "text",
  },
  {
    label: "Payment Test Method",
    name: "paymentMethod",
    type: "text",
  },
  {
    label: "Test Field",
    name: "testField",
    type: "text",
  },
  {
    label: "URL Field",
    name: "url",
    type: "url",
  },
  {
    label: "Email Field",
    name: "email",
    type: "email",
  },
  {
    label: "Password Field",
    name: "password",
    type: "password",
  },
  {
    label: "Telephone Field",
    name: "telephone",
    type: "tel",
  },
  {
    default: "https://example.com",
    label: "URL Field",
    name: "url",
    type: "url",
  },
  {
    default: "example@example.com",
    label: "Email Field",
    name: "email",
    type: "email",
  },
  {
    default: "",
    label: "Password Field",
    name: "password",
    type: "password",
  },
  {
    default: "+1234567890",
    label: "Telephone Field",
    name: "telephone",
    type: "tel",
  },
  {
    default: true,
    label: "Enable Feature Flag",
    name: "enableFeatureFlag",
    type: "boolean",
  },
  {
    label: "Optional Toggle",
    name: "optionalToggle",
    type: "boolean",
  },
  {
    env: ["saas"],
    label: "SaaS API Key",
    name: "saasOnlyApiKey",
    type: "password",
  },
  {
    env: ["paas"],
    label: "PaaS Token",
    name: "paasOnlyToken",
    type: "text",
  },
  {
    env: ["paas", "saas"],
    label: "Both Envs Field",
    name: "bothEnvsField",
    type: "text",
  },
] satisfies BusinessConfigSchema;

export const INVALID_CONFIGURATION = [
  {
    default: "option1",
    options: [{ label: "Option 1", value: "option1" }],
    type: "list",
  },
  {
    label: "Currency",
    type: "text",
  },
  {
    label: "Payment Test Method",
    type: "text",
  },
  {
    label: "Test Field",
    type: "text",
  },
];

export const VALID_CONFIGURATION_WITHOUT_DEFAULTS = [
  {
    // `list` is the only one always requiring a default because we can't set one programmatically
    default: "option1",
    name: "exampleList",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "single",
    type: "list",
  },
  {
    name: "exampleList",
    options: [{ label: "Option 1", value: "option1" }],
    selectionMode: "multiple",
    type: "list",
  },
  {
    label: "Text",
    name: "text",
    type: "text",
  },
  {
    label: "Email",
    name: "email",
    type: "email",
  },
  {
    label: "Telephone",
    name: "telephone",
    type: "tel",
  },
  {
    label: "URL",
    name: "url",
    type: "url",
  },
  {
    label: "Password",
    name: "password",
    type: "password",
  },
] satisfies BusinessConfigSchema;
