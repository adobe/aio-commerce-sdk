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

import { writeFile } from "node:fs/promises";

/**
 * Touch a file, creating it if it doesn't exist.
 * @param filePath The path of the file to touch
 */
export async function touch(filePath: string) {
  await writeFile(filePath, "", { flag: "wx" }).catch((e) => {
    if (e.code !== "EEXIST") {
      throw e;
    }
  });
}
