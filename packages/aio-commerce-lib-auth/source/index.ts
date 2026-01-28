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
// biome-ignore lint/performance/noBarrelFile: export as part of the Public API
export {
  type ForwardedImsAuthSource,
  getForwardedImsAuthProvider,
} from "./lib/ims-auth/forwarding";
export {
  forwardImsAuthProviderFromParams,
  getImsAuthProvider,
  isImsAuthProvider,
} from "./lib/ims-auth/provider";
export { assertImsAuthParams } from "./lib/ims-auth/utils";
export {
  getIntegrationAuthProvider,
  type IntegrationAuthProvider,
  isIntegrationAuthProvider,
} from "./lib/integration-auth/provider";
export { assertIntegrationAuthParams } from "./lib/integration-auth/utils";
export { resolveAuthParams } from "./lib/utils";

export type { ImsAuthEnv, ImsAuthParams } from "./lib/ims-auth/schema";
export type { ImsAuthHeaders, ImsAuthProvider } from "./lib/ims-auth/types";
export type { IntegrationAuthParams } from "./lib/integration-auth/schema";
export type * from "./lib/utils";
