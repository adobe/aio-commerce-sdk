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

/** The type of the runtime action parameters. */
export type RuntimeActionParams = {
  /** If the runtime action is invoked via HTTP, this will be the headers of the request. */
  __ow_headers?: Record<string, string | undefined>;

  /** If the runtime action is invoked via HTTP, this will be the HTTP method of the request. */
  __ow_method?: string;

  // Remaining unknown properties.
  [key: string]: unknown;
};
