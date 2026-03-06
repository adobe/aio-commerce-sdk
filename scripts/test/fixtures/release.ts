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

import { vi } from "vitest";

import type { AsyncFunctionArguments } from "#ci/release/types";

/** The registry URL for internally released packages. */
export const INTERNAL_REGISTRY_URL =
  "https://artifactory.example.com/artifactory/api/npm/npm-internal/";

/** The base URL to preview internally released packages. */
export const INTERNAL_PACKAGE_BASE_URL =
  "https://artifactory.example.com/ui/native/npm-internal/";

export const PUBLIC_REGISTRY_URL = "https://registry.npmjs.org";
export const PUBLIC_PACKAGE_BASE_URL = "https://npmx.dev/package";
export const INTERNAL_AUTH_TOKEN = "token-123";
export const PUBLIC_AUTH_TOKEN = "token-public";
export const MAIN_BRANCH = "main";
export const RELEASE_BRANCH = "release";

export const CORE_PACKAGE_JSON = JSON.stringify([
  { name: "@adobe/aio-commerce-lib-core", version: "1.2.3" },
]);
export const INTERNAL_SDK_PACKAGE_JSON = JSON.stringify([
  { name: "@adobe/aio-commerce-sdk", version: "1.2.5-beta.1" },
]);
export const SDK_AND_CORE_PACKAGES_JSON = JSON.stringify([
  { name: "@adobe/aio-commerce-lib-core", version: "1.0.0" },
  { name: "@adobe/aio-commerce-sdk", version: "1.0.0" },
]);
export const THREE_PACKAGES_JSON = JSON.stringify([
  { name: "@adobe/aio-commerce-lib-zeta", version: "1.0.0" },
  { name: "@adobe/aio-commerce-sdk", version: "1.0.0" },
  { name: "@adobe/aio-commerce-lib-alpha", version: "1.0.0" },
]);
export const INVALID_PACKAGES_JSON = "{not-valid-json}";

export function createChangesetConfigJson(values: { baseBranch: string }) {
  return JSON.stringify({ baseBranch: values.baseBranch ?? MAIN_BRANCH });
}

export function createChangesetPreJson(values: { preMode: string }) {
  return JSON.stringify({ mode: values.preMode ?? "pre" });
}

export const PRE_JSON = createChangesetPreJson({
  preMode: "pre",
});

export const PRE_JSON_EXIT = createChangesetPreJson({
  preMode: "exit",
});

export const CONFIG_JSON_MAIN_BRANCH = createChangesetConfigJson({
  baseBranch: MAIN_BRANCH,
});

export const CONFIG_JSON_RELEASE_BRANCH = createChangesetConfigJson({
  baseBranch: RELEASE_BRANCH,
});

export function createCoreMock() {
  return {
    setFailed: vi.fn<AsyncFunctionArguments["core"]["setFailed"]>(),
    setOutput: vi.fn<AsyncFunctionArguments["core"]["setOutput"]>(),
  };
}

export function createExecMock() {
  return {
    exec: vi.fn<AsyncFunctionArguments["exec"]["exec"]>(),
  };
}

export function asCore(
  core: ReturnType<typeof createCoreMock>,
): AsyncFunctionArguments["core"] {
  return core as unknown as AsyncFunctionArguments["core"];
}

export function asExec(
  exec: ReturnType<typeof createExecMock>,
): AsyncFunctionArguments["exec"] {
  return exec as unknown as AsyncFunctionArguments["exec"];
}
