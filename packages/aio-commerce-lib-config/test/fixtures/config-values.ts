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

import type { ConfigValueWithOptionalOrigin } from "#modules/configuration/types";

/**
 * Mock config values set at global scope for use in unit tests.
 * IDs match the scope tree fixture in `scope-tree.ts`.
 */
export const globalConfigValues: ConfigValueWithOptionalOrigin[] = [
  {
    name: "currency",
    value: "USD",
    origin: { id: "id-global", code: "global", level: "global" },
  },
  {
    name: "locale",
    value: "en_US",
    origin: { id: "id-global", code: "global", level: "global" },
  },
];
