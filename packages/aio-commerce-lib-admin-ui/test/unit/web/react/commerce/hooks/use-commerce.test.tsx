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

import { Suspense } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { SharedContextProvider } from "#web/react/commerce/context/shared-context.tsx";
import { useCommerce } from "#web/react/commerce/hooks/use-commerce";

import type { ReactNode } from "react";

afterEach(() => {
  vi.restoreAllMocks();
});

/** Builds a minimal fake UIX guest connection with the given host object. */
function makeConnection(host: object) {
  return {
    addEventListener: vi.fn(() => vi.fn()),
    host,
    sharedContext: new Map<string, unknown>(),
  };
}

// The module-level promise cache in `use-commerce` is keyed by `extensionId`,
// so each test uses a unique ID to avoid cross-test cache hits.
describe("useCommerce", () => {
  test("suspends and resolves the Commerce host over the connection, caching the promise", async () => {
    const getCommerceHost = vi.fn().mockResolvedValue("my-store.example.com");
    const connection = makeConnection({ integration: { getCommerceHost } });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SharedContextProvider
        extensionId="ext-use-commerce-happy"
        // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
        guestConnection={connection}>
        <Suspense fallback={null}>{children}</Suspense>
      </SharedContextProvider>
    );

    const { result } = await renderHook(() => useCommerce(), { wrapper });
    await vi.waitFor(() => expect(result.current).not.toBeNull());

    expect(getCommerceHost).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({
      data: { commerceHost: "my-store.example.com" },
      error: null,
    });
  });

  test("returns an error when the host lacks the integration API", async () => {
    const connection = makeConnection({});
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SharedContextProvider
        extensionId="ext-use-commerce-no-integration"
        // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
        guestConnection={connection}>
        <Suspense fallback={null}>{children}</Suspense>
      </SharedContextProvider>
    );

    const { result } = await renderHook(() => useCommerce(), { wrapper });
    await vi.waitFor(() => expect(result.current).not.toBeNull());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "The host does not provide the integration API",
    );
  });

  test("returns an error when resolving the Commerce host rejects", async () => {
    const error = new Error("unavailable");
    const getCommerceHost = vi.fn().mockRejectedValue(error);
    const connection = makeConnection({ integration: { getCommerceHost } });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SharedContextProvider
        extensionId="ext-use-commerce-reject"
        // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
        guestConnection={connection}>
        <Suspense fallback={null}>{children}</Suspense>
      </SharedContextProvider>
    );

    const { result } = await renderHook(() => useCommerce(), { wrapper });
    await vi.waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current).toEqual({
      data: null,
      error: expect.objectContaining({
        cause: error,
        message: expect.stringContaining("Failed to resolve the Commerce host"),
      }),
    });
  });

  test("returns an error when used outside the Commerce shared context", async () => {
    const { result } = await renderHook(() => useCommerce());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "useCommerce requires running inside the Commerce Admin",
    );
  });
});
