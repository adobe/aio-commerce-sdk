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

/** Name of the response header that carries the version of the `@adobe/aio-commerce-lib-app` SDK library, not the app's own version. */
export const SDK_LIB_APP_VERSION_HEADER = "x-sdk-lib-app-version";

/**
 * Version sent in {@link SDK_LIB_APP_VERSION_HEADER}. TSDown and Vitest replace `__PKG_VERSION__` at
 * build time. It is "unknown" when the variable is not defined.
 */
export const SDK_LIB_APP_VERSION: string =
  typeof __PKG_VERSION__ === "string" ? __PKG_VERSION__ : "unknown";

/** Headers every app-management router adds to its responses. */
export const SDK_LIB_APP_VERSION_HEADERS = {
  [SDK_LIB_APP_VERSION_HEADER]: SDK_LIB_APP_VERSION,
};
