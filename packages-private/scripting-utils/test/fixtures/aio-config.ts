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

import { join } from "node:path";

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import { vi } from "vitest";

import { withTempFiles } from "#filesystem/temp";

/**
 * Points the real `@adobe/aio-lib-core-config` store at a temporary config
 * file (via `AIO_CONFIG_FILE`, its documented override) so tests exercise
 * the library's actual dotted-path config resolution instead of a mock that
 * just echoes back whatever key it was asked for.
 */
export function withAioConfig<T>(
  values: Record<string, unknown>,
  callback: () => Promise<T> | T,
): Promise<T> {
  return withTempFiles(
    { "aio-config.json": JSON.stringify(values) },
    async (tempDir) => {
      vi.stubEnv("AIO_CONFIG_FILE", join(tempDir, "aio-config.json"));
      config.reload();

      try {
        return await callback();
      } finally {
        vi.unstubAllEnvs();
        config.reload();
      }
    },
  );
}
