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

import { init as initFiles } from "@adobe/aio-lib-files";
import { init as initState } from "@adobe/aio-lib-state";

import type { Files } from "@adobe/aio-lib-files";
import type { AdobeState } from "@adobe/aio-lib-state";

/** Defines the options for initializing the Adobe State library. */
export type LibStateOptions = {
  /**
   * The region where `aio-lib-state` should operate. By default, the most optimal region is
   * automatically determined based on where the runtime action is running.
   *
   * @see https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/storage/application-state#state
   */
  region?: "amer" | "emea" | "apac" | "aus";
};

// Shared instances - single source of truth for all repositories
let __sharedState: AdobeState | null = null;
let __sharedFiles: Files | null = null;

let __globalStateOptions: LibStateOptions | null = null;

function getOptimalRegion(owRegion: string | undefined) {
  // See: https://developer.adobe.com/app-builder/docs/guides/runtime_guides/reference_docs/multiple-regions
  const regionMapping: Record<string, string> = {
    "us-east-1": "amer",
    "eu-west-1": "emea",
    "ap-northeast-1": "apac",
    "ap-southeast-2": "aus",
  };

  const defaultRegion = "us-east-1";
  return owRegion && regionMapping[owRegion]
    ? regionMapping[owRegion]
    : regionMapping[defaultRegion];
}

/**
 * Set global state options for the library. This should be called before any repository functions to ensure the options are applied.
 * @param options - The options to configure the Adobe State library.
 */
export function setGlobalStateOptions(options: LibStateOptions) {
  __globalStateOptions = options;
}

/**
 * Get the shared state instance (lazy initialization)
 * @returns Promise resolving to the shared AdobeState instance
 */
export async function getSharedState(): Promise<AdobeState> {
  if (!__sharedState) {
    const initRegion = __globalStateOptions?.region ?? "auto";
    const region =
      initRegion === "auto"
        ? getOptimalRegion(process.env.__OW_REGION)
        : initRegion;

    __sharedState = await initState({ region });
  }

  return __sharedState;
}

/**
 * Get the shared files instance (lazy initialization)
 * @returns Promise resolving to the shared Files instance
 */
export async function getSharedFiles(): Promise<Files> {
  if (!__sharedFiles) {
    __sharedFiles = await initFiles();
  }
  return __sharedFiles;
}
