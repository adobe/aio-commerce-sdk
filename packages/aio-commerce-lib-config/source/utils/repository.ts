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

/** A supported `aio-lib-state` region. */
export type Region = "amer" | "emea" | "apac" | "aus";

/** Defines the options for initializing the Adobe State library. */
export type LibStateOptions = {
  /**
   * The region where `aio-lib-state` should operate. By default, the most optimal region is
   * automatically determined based on where the runtime action is running.
   *
   * @see https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/storage/application-state#state
   */
  region?: Region;
};

/**
 * Every region `aio-lib-state` supports. Each region is an independent store with no
 * cross-region replication, so cache invalidation must be fanned out to all of them
 * explicitly to avoid stale reads from action instances routed to other regions.
 */
export const ALL_REGIONS: Region[] = ["amer", "emea", "apac", "aus"];

// Shared instances - single source of truth for all repositories
const __sharedStateByRegion = new Map<Region, Promise<AdobeState>>();
let __sharedFiles: Files | null = null;

let __globalStateOptions: LibStateOptions | null = null;

function getOptimalRegion(owRegion: string | undefined): Region {
  // See: https://developer.adobe.com/app-builder/docs/guides/runtime_guides/reference_docs/multiple-regions
  const regionMapping: Record<string, Region> = {
    "ap-northeast-1": "apac",
    "ap-southeast-2": "aus",
    "eu-west-1": "emea",
    "us-east-1": "amer",
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
 * Get (or lazily initialize) the shared state instance for a specific region. Each region is
 * memoized independently so it is only ever initialized once per process.
 * @param region - The `aio-lib-state` region to get a client for.
 * @returns Promise resolving to the shared AdobeState instance for that region.
 */
function getSharedStateForRegion(region: Region): Promise<AdobeState> {
  let statePromise = __sharedStateByRegion.get(region);
  if (!statePromise) {
    statePromise = initState({ region });
    __sharedStateByRegion.set(region, statePromise);
  }

  return statePromise;
}

/**
 * Get the shared state instance for the current (optimal or globally-configured) region.
 * @returns Promise resolving to the shared AdobeState instance
 */
export function getSharedState(): Promise<AdobeState> {
  const initRegion = __globalStateOptions?.region ?? "auto";
  const region =
    initRegion === "auto"
      ? getOptimalRegion(process.env.__OW_REGION)
      : initRegion;

  return getSharedStateForRegion(region);
}

/**
 * Get the shared state instances for every supported region. Used to fan out cache
 * invalidation on config writes/deletes, since `aio-lib-state` regions are independent
 * stores with no cross-region replication.
 * @returns Promise resolving to an array of shared AdobeState instances, one per region.
 */
export function getSharedStatesForAllRegions(): Promise<AdobeState[]> {
  return Promise.all(ALL_REGIONS.map(getSharedStateForRegion));
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
