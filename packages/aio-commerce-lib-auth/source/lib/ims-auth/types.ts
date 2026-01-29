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

/** Defines the headers required for IMS authentication. */
export type ImsAuthHeaders = {
  Authorization: string;
  "x-api-key"?: string;
};

/** Defines an authentication provider for Adobe IMS. */
export type ImsAuthProvider = {
  getAccessToken: () => Promise<string> | string;
  getHeaders: () => Promise<ImsAuthHeaders> | ImsAuthHeaders;
};
