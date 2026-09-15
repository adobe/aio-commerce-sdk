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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { setNodeEnv } from "@aio-commerce-sdk/scripting-utils/env";
import { getProjectRootDirectory } from "@aio-commerce-sdk/scripting-utils/project";
import consola from "consola";

/**
 * Resets the web build back to development by writing `NODE_ENV` to the project `.env`.
 * @param projectRoot - Resolved project root containing the `.env` file.
 */
export async function run(projectRoot: string) {
  await setNodeEnv("development", projectRoot);
}

/** Runs the pre-app-run hook. */
export async function exec() {
  consola.debug("Running lib-app pre-app-run hook");

  try {
    const projectRoot = await getProjectRootDirectory();
    await run(projectRoot);
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }
    process.exit(1);
  }
}
