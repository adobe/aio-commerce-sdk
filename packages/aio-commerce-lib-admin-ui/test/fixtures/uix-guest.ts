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

export type MockGuestConnectionOverrides = Partial<{
  host: object;
  sharedContext: Map<string, unknown>;
}>;

/**
 * Builds a minimal fake UIX guest connection, matching what `SharedContextProvider`
 * and `useGuestConnection` consume. `@adobe/uix-guest` needs a real uix-host across
 * the iframe bridge, so this stands in for the resolved connection object.
 *
 * @param overrides - Partial fields to merge over the defaults.
 */
export function createMockGuestConnection(
  overrides: MockGuestConnectionOverrides = {},
) {
  return {
    addEventListener: vi.fn(() => vi.fn()),
    host: {},
    sharedContext: new Map<string, unknown>([["theme", "dark"]]),
    ...overrides,
  };
}

/**
 * Factory for `vi.mock("@adobe/uix-guest", ...)`. `register`/`attach` reach a real
 * uix-host, so they are the legitimate external boundary to fake. Import the mocked
 * `attach`/`register` in the test and drive them with `vi.mocked(...).mockResolvedValue`.
 */
export function uixGuestMock() {
  return { attach: vi.fn(), register: vi.fn() };
}
