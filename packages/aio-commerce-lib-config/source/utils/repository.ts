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

// Shared instances - single source of truth for all repositories
let __sharedState: AdobeState | null = null;
let __sharedFiles: Files | null = null;

/**
 * Get the shared state instance (lazy initialization)
 * @returns Promise resolving to the shared AdobeState instance
 */
export async function getSharedState(): Promise<AdobeState> {
  if (!__sharedState) {
    __sharedState = await initState();
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
