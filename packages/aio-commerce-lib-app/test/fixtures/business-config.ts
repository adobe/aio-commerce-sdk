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
  ResolvedBusinessConfigSchema,
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
] satisfies ResolvedBusinessConfigSchema;

/** Schema with a single dynamicList field whose options are resolved at runtime. */
export const schemaWithDynamicListOptions = [
  {
    name: "paymentMethod",
    type: "dynamicList",
    selectionMode: "single",
    options: () => [{ label: "Braintree", value: "braintree" }],
    default: (opts) => opts[0].value,
  },
] satisfies BusinessConfigSchema;

/**
 * JS source for `app.commerce.config.js` written to disk in temp project
 * fixtures so codegen integration tests can bundle a real config file with a
 * `dynamicList` factory.
 */
export const dynamicOptionsConfigFile = `export default {
  metadata: {
    id: "dynamic-options",
    displayName: "Dynamic Options",
    description: "Dynamic options test",
    version: "1.0.0",
  },
  businessConfig: {
    schema: [{
      name: "paymentMethod",
      type: "dynamicList",
      selectionMode: "single",
      options: () => [{ label: "Braintree", value: "braintree" }],
      default: (opts) => opts[0].value,
    }],
  },
};
`;

/**
 * TS source for `app.commerce.config.ts`. Used in integration tests to verify
 * the runtime config module bundler handles TypeScript inputs via esbuild.
 * Uses type annotations and a TS-only construct (\`satisfies\`) to ensure
 * esbuild's TypeScript loader is actually exercised.
 */
export const dynamicOptionsConfigFileTs = `
type CommerceEnv = "paas" | "saas";

const config = {
  metadata: {
    id: "dynamic-options",
    displayName: "Dynamic Options",
    description: "Dynamic options test",
    version: "1.0.0",
  },
  businessConfig: {
    schema: [{
      name: "paymentMethod" as const,
      type: "dynamicList" as const,
      selectionMode: "single" as const,
      env: ["paas", "saas"] satisfies CommerceEnv[],
      options: () => [{ label: "Braintree", value: "braintree" }],
      default: (opts: { value: string }[]) => opts[0].value,
    }],
  },
};

export default config;
`;
