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

import { baseConfig } from "@aio-commerce-sdk/config-tsdown/tsdown.config.base";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...baseConfig,
  entry: ["./source/commerce/index.ts", "./source/io-events/index.ts"],

  // This package API is currently private so we need it to mark it as no-external (not published)
  // otherwise it won't work when installed in a project (as the dependency won't be found in NPM).
  // This can be transparently removed if the API library gets published and evertything will work the same.
  noExternal: ["@aio-commerce-sdk/aio-commerce-lib-api"],
});
