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

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";

/** Shape of the `project` entry in the local AIO CLI config (`.aio`/`aio` config store). */
export type AioProjectConfig = {
  id: string;
  name: string;
  org: {
    id: string;
    ims_org_id: string;
    name: string;
  };
  title: string;
  workspace: {
    id: string;
    name: string;
    title: string;
  };
};

/** The current App Builder project and Runtime namespace, from the local AIO CLI config. */
export type AioProjectContext = {
  project: AioProjectConfig;
  namespace: string;
};

/**
 * Reads the current App Builder project and Runtime namespace from the local AIO CLI config.
 * @throws If either the project or the runtime namespace is not configured.
 */
export function getAioProjectContext(): AioProjectContext {
  const project = config.get("project") as AioProjectConfig | undefined;
  const namespace = config.get("runtime.namespace") as string | undefined;

  if (!(project && namespace)) {
    throw new Error(
      "The current App Builder project and Runtime namespace are required",
    );
  }

  return { namespace, project };
}

/** The AIO CLI environment. */
export type AioCliEnv = "stage" | "prod";

/** Reads the configured AIO CLI environment, defaulting to `"prod"`. */
export function getAioCliEnv(): AioCliEnv {
  const env = config.get("cli.env") as AioCliEnv | undefined;
  return env === "stage" ? "stage" : "prod";
}
