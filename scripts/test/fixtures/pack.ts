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

import { readFileSync } from "node:fs";

export const ORIGINAL_PACKAGE_JSON = JSON.stringify(
  {
    name: "@adobe/test-package",
    description: "original",
  },
  null,
  2,
);

export const BUILD_PACKAGE_JSON = JSON.stringify(
  {
    name: "@adobe/test-package",
    description: "build",
  },
  null,
  2,
);

export const EXISTING_BACKUP_PACKAGE_JSON = JSON.stringify(
  {
    name: "@adobe/test-package",
    description: "existing-backup",
  },
  null,
  2,
);

export function readTextFile(path: string) {
  return readFileSync(path, "utf8");
}
