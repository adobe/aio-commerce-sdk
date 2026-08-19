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

import { syncImsCredentials } from "@aio-commerce-sdk/scripting-utils/env";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

/**
 * Synchronizes current-context IMS credentials to the nearest project's `.env`.
 */
export async function run() {
  consola.start("Syncing IMS credentials...");

  try {
    const projectRoot = await getProjectRootDirectory();
    const result = await syncImsCredentials(projectRoot);

    if (!result.ok) {
      switch (result.reason) {
        case "missing-env":
          consola.warn(
            ".env not found — run `aio app use` to configure your workspace.",
          );
          break;
        case "no-ims-context":
          consola.warn(
            "No IMS context configured — run `aio login` to authenticate.",
          );
          break;
        default: {
          // exhaustiveness check — errors if a new reason is added without handling it
          const _: never = result.reason;
        }
      }
      return;
    }

    consola.success(
      "IMS credentials successfully synced to their AIO_COMMERCE_IMS_AUTH counterparts!",
    );
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}
