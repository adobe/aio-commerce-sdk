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

import { sharedContextProvider } from "#test/utils/shared-context.tsx";
import { useSharedContext } from "#web/react/commerce/context/shared-context.tsx";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Builds a minimal fake UIX guest connection for the provider. */
function makeConnection() {
  return {
    addEventListener: vi.fn((_event: string, _onChange: () => void) => vi.fn()),
    host: {},
    sharedContext: new Map([
      ["imsToken", "t"],
      ["imsOrgId", "o"],
    ]),
  };
}

describe("useSharedContext", () => {
  test("returns an error when used outside a SharedContextProvider", async () => {
    const { result } = await renderHook(() => useSharedContext());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "useSharedContext must be used inside a SharedContextProvider",
    );
  });

  test("returns the extension ID, shared context and host from the provider", async () => {
    const connection = makeConnection();
    const { result } = await renderHook(() => useSharedContext(), {
      wrapper: sharedContextProvider(connection),
    });

    expect.assert.isNull(result.current.error);
    expect(result.current.data.extensionId).toBe("ext-1");
    expect(result.current.data.sharedContext).toBe(connection.sharedContext);
    expect(result.current.data.host).toBe(connection.host);
  });

  test("re-renders with the new shared context on a contextchange event", async () => {
    const connection = makeConnection();
    const { result, act } = await renderHook(() => useSharedContext(), {
      wrapper: sharedContextProvider(connection),
    });

    expect(connection.addEventListener).toHaveBeenCalledWith(
      "contextchange",
      expect.any(Function),
    );

    const [, onContextChange] = connection.addEventListener.mock.calls[0];
    const newSharedContext = new Map([
      ["imsToken", "t2"],
      ["imsOrgId", "o2"],
    ]);

    connection.sharedContext = newSharedContext;
    await act(() => onContextChange());

    expect.assert.isNull(result.current.error);
    expect(result.current.data.sharedContext).toBe(newSharedContext);
  });
});
