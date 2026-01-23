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

import { baseConfig } from "@aio-commerce-sdk/config-tsdown/tsdown.config.base";
import { mergeConfig } from "tsdown";

export default mergeConfig(baseConfig, {
  entry: ["./source/index.ts", "./source/commands/index.ts"],
  copy: [
    {
      from: "./source/commands/generate/actions/templates",
      to: "./dist/cjs/commands/generate/actions/templates",
    },
    {
      from: "./source/commands/generate/actions/templates",
      to: "./dist/es/commands/generate/actions/templates",
    },
  ],

  // This package is private and needs to be bundled as a no-external dependency.
  noExternal: ["@aio-commerce-sdk/scripting-utils"],
});
