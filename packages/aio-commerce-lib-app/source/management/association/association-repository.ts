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

import {
  getSystemConfigByKey,
  MAX_SYSTEM_CONFIG_CACHE_TTL_SECONDS,
  setSystemConfigByKey,
} from "@adobe/aio-commerce-lib-config";

import type { AssociatedCommerceInstance } from "./types";

/** Reserved key under which association data is stored. */
const ASSOCIATION_KEY = "system.association";

// Association data changes rarely and `aio-lib-files` is the source of truth,
// so cache it for the maximum TTL to keep reads served from `aio-lib-state`
// rather than falling back to files once the default daily cache expires.
const ASSOCIATION_CACHE_TTL_SECONDS = MAX_SYSTEM_CONFIG_CACHE_TTL_SECONDS;

/**
 * Stores the Commerce instance the app is associated with.
 *
 * Called by the `association` runtime action's `POST /` handler when App
 * Management registers the app with a Commerce instance.
 *
 * @param data - The Commerce instance details to persist.
 */
export async function setAssociationData(
  data: AssociatedCommerceInstance,
): Promise<void> {
  await setSystemConfigByKey(
    ASSOCIATION_KEY,
    data,
    ASSOCIATION_CACHE_TTL_SECONDS,
  );
}

/**
 * Retrieves the Commerce instance the app is currently associated with.
 *
 * @returns The stored association data, or `null` if the app is not associated.
 */
export async function getAssociationData(): Promise<AssociatedCommerceInstance | null> {
  return getSystemConfigByKey<AssociatedCommerceInstance>(
    ASSOCIATION_KEY,
    ASSOCIATION_CACHE_TTL_SECONDS,
  );
}

/**
 * Clears the stored association data.
 *
 * Called by the `association` runtime action's `DELETE /` handler when the
 * app is unassociated.
 */
export async function clearAssociationData(): Promise<void> {
  await setSystemConfigByKey(ASSOCIATION_KEY, null);
}
