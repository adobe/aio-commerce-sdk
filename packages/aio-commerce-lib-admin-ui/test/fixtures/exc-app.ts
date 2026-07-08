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

import type { Runtime } from "@adobe/exc-app";

type RuntimeHandler = (event?: unknown) => void;

/** A fake exc-app runtime plus the handlers it captured, so tests can fire events by name. */
export type MockRuntime = Runtime & {
  handlers: Record<string, RuntimeHandler>;
};

/**
 * Builds a minimal fake exc-app runtime (an EventEmitter). `@adobe/exc-app` needs the real
 * Experience Cloud runtime, so this stands in for it. Registered handlers are captured on
 * `handlers` keyed by event name, so tests can drive an event with e.g.
 * `runtime.handlers.configuration(payload)` instead of digging through `on.mock.calls`.
 *
 * @param overrides - Partial fields to merge over the defaults (e.g. `lastConfigurationPayload`).
 */
export function createMockRuntime(
  overrides: Partial<Runtime> = {},
): MockRuntime {
  const handlers: Record<string, RuntimeHandler> = {};
  const runtime: Runtime = {
    on: vi.fn((type, handler) => {
      handlers[type as string] = handler as RuntimeHandler;
    }),
    off: vi.fn(),
    emit: vi.fn(),
    configured: false,
    lastConfigurationPayload: null,
    ...overrides,
  };

  return Object.assign(runtime, { handlers });
}
