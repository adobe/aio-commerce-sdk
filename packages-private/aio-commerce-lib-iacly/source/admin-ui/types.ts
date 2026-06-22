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

/** Desired state for an Admin UI extension registration. */
export type AdminUiExtensionConfig = {
  readonly extensionName: string;
  readonly extensionTitle: string;
  readonly extensionUrl: string;
  readonly extensionWorkspace: string;
};

/** Live state after registration — carries the API-assigned extensionId for teardown. */
export type AdminUiExtensionState = {
  readonly extensionId: string;
  readonly extensionName: string;
  readonly extensionWorkspace: string;
  readonly extensionUrl: string;
  readonly extensionTitle: string;
};

/** Top-level Admin UI config block in LibIaclyConfig. */
export type AdminUiConfig = {
  readonly extensions: readonly AdminUiExtensionConfig[];
};
