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

import type { CommerceAppConfig } from "@adobe/aio-commerce-lib-app/config";

/** The default app.commerce.config.js schema */
export const DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA: Partial<CommerceAppConfig> = {
  businessConfig: {
    schema: [
      {
        name: "exampleList",
        type: "list",
        label: "Example List",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
        ],
        selectionMode: "single",
        default: "option1",
        description: "This is a description for the example list",
      },
      {
        name: "currency",
        type: "text",
        label: "Currency",
      },
    ],
  },
};

/** To match environment variables in the .env file */
export const ENV_VAR_REGEX = /^([A-Z_]+)=/;
