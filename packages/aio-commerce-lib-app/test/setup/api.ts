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

import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

export const apiServer = setupServer();

/** Registers the standard MSW lifecycle for API integration tests. */
export function setupApiTestLifecycle() {
  beforeAll(() => apiServer.listen({ onUnhandledRequest: "error" }));
  afterAll(() => apiServer.close());
  afterEach(() => apiServer.resetHandlers());
}
