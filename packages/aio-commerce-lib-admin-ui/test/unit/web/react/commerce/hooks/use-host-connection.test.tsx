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

import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { createMockGuestConnection } from "#test/fixtures/uix-guest";
import { sharedContextProvider } from "#test/utils/shared-context.tsx";
import { useHostConnection } from "#web/react/commerce/hooks/use-host-connection";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Builds a wrapper with a fake connection exposing the given host object. */
function provide(host: object) {
  return sharedContextProvider(createMockGuestConnection({ host }));
}

describe("useHostConnection", () => {
  test("invokes the host frame actions when the host provides them", async () => {
    const field = {
      close: vi.fn().mockResolvedValue(undefined),
      onError: vi.fn().mockResolvedValue(undefined),
    };

    const { result } = await renderHook(() => useHostConnection(), {
      wrapper: provide({ field }),
    });

    expect.assert.isNull(result.current.error);

    await result.current.actions.close();
    expect(field.close).toHaveBeenCalledTimes(1);

    await result.current.actions.closeWithError();
    expect(field.onError).toHaveBeenCalledTimes(1);
  });

  test("preserves the actions when the host is unchanged", async () => {
    const field = {
      close: vi.fn().mockResolvedValue(undefined),
      onError: vi.fn().mockResolvedValue(undefined),
    };

    const { result, rerender } = await renderHook(() => useHostConnection(), {
      wrapper: provide({ field }),
    });

    const initialResult = result.current;
    await rerender();

    expect(result.current).toBe(initialResult);
  });

  test("returns an error when the host does not provide the frame actions", async () => {
    const { result } = await renderHook(() => useHostConnection(), {
      wrapper: provide({}),
    });

    expect.assert.isNull(result.current.actions);
    expect(result.current.error.message).toContain(
      "Host frame actions are unavailable",
    );
  });

  test("returns an error when used outside the Commerce shared context", async () => {
    const { result } = await renderHook(() => useHostConnection());

    expect.assert.isNull(result.current.actions);
    expect(result.current.error.message).toContain(
      "useSharedContext must be used inside a SharedContextProvider",
    );
  });
});
