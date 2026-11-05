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

import libConfigPkg from "@adobe/aio-commerce-lib-config/package.json" with {
  type: "json",
};

/**
 * Name of the response header that carries the versions of the SDK libraries the app-management
 * endpoints were built with. These are not the app's own version.
 */
export const SDK_LIB_VERSIONS_HEADER = "x-sdk-lib-versions";

const UNKNOWN_VERSION = "unknown";

/**
 * Value of {@link SDK_LIB_VERSIONS_HEADER}, an RFC 8941 dictionary with string values, e.g.
 * `lib-app="2.2.0", lib-config="1.4.1"`. TSDown and Vitest replace `__PKG_VERSION__` for
 * `lib-app`, which is "unknown" when the variable is not defined. `lib-config` is the version
 * in the `package.json` of the copy of lib-config that lib-app loads, which the app's bundler
 * resolves when it builds the action.
 */
export const SDK_LIB_VERSIONS: string = [
  [
    "lib-app",
    typeof __PKG_VERSION__ === "string" ? __PKG_VERSION__ : UNKNOWN_VERSION,
  ],
  ["lib-config", libConfigPkg.version ?? UNKNOWN_VERSION],
]
  .map(([name, version]) => `${name}="${version}"`)
  .join(", ");

/** Headers every app-management router adds to its responses. */
export const SDK_LIB_VERSIONS_HEADERS = {
  [SDK_LIB_VERSIONS_HEADER]: SDK_LIB_VERSIONS,
};
