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
import {
  useMassActionContext,
  useOrderViewButtonContext,
} from "#web/react/commerce/hooks/use-extension-context";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Builds a wrapper with a fake connection exposing the given shared context entries. */
function provide(entries: Record<string, unknown>) {
  return sharedContextProvider(
    createMockGuestConnection({
      sharedContext: new Map(Object.entries(entries)),
    }),
  );
}

describe("useMassActionContext", () => {
  test("returns the selected IDs from the shared context", async () => {
    const { result } = await renderHook(() => useMassActionContext(), {
      wrapper: provide({ selectedIds: ["1", "2"] }),
    });

    expect(result.current).toEqual({
      data: { selectedIds: ["1", "2"] },
      error: null,
    });
  });

  test("returns an error when no rows are selected", async () => {
    const { result } = await renderHook(() => useMassActionContext(), {
      wrapper: provide({ selectedIds: [] }),
    });

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain("No rows selected");
  });

  test("returns an error when a selected ID is not a string", async () => {
    const { result } = await renderHook(() => useMassActionContext(), {
      wrapper: provide({ selectedIds: ["1", 2] }),
    });

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "All selected row IDs must be strings",
    );
  });

  test("preserves the result when the shared context is unchanged", async () => {
    const { result, rerender } = await renderHook(
      () => useMassActionContext(),
      {
        wrapper: provide({ selectedIds: ["1", "2"] }),
      },
    );

    const initialResult = result.current;
    await rerender();

    expect(result.current).toBe(initialResult);
  });

  test("returns an error when the shared context has no selectedIds key", async () => {
    const { result } = await renderHook(() => useMassActionContext(), {
      wrapper: provide({}),
    });

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "Could not find `selectedIds` in the Commerce shared context",
    );
  });

  test("returns an error when used outside the Commerce shared context", async () => {
    const { result } = await renderHook(() => useMassActionContext());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "useSharedContext must be used inside a SharedContextProvider",
    );
  });
});

describe("useOrderViewButtonContext", () => {
  afterEach(() => {
    history.replaceState(null, "", "/");
  });

  test("returns the order ID from the URL search params", async () => {
    window.history.replaceState(null, "", "?orderId=000000123");

    const { result, rerender } = await renderHook(() =>
      useOrderViewButtonContext(),
    );
    expect(result.current).toEqual({
      data: { orderId: "000000123" },
      error: null,
    });

    const initialResult = result.current;
    await rerender();

    expect(result.current).toBe(initialResult);
  });

  test("returns the order ID from the URL hash", async () => {
    window.history.replaceState(null, "", "/#/view?orderId=7");

    const { result } = await renderHook(() => useOrderViewButtonContext());
    expect(result.current).toEqual({ data: { orderId: "7" }, error: null });
  });

  test("returns an error when the URL has no order ID", async () => {
    const { result } = await renderHook(() => useOrderViewButtonContext());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "Could not find an order ID",
    );
  });
});
