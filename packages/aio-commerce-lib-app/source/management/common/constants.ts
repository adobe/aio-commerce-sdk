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

/**
 * Timeout (in milliseconds) applied to Commerce HTTP clients used for
 * long-running operations (e.g. lifecycle/installation steps, scope syncing).
 * Commerce can take a while to respond to some of these, so we raise it well
 * above the underlying client's default.
 */
export const LIFECYCLE_HTTP_CLIENT_TIMEOUT_MS = 1000 * 60 * 2; // 2 minutes
