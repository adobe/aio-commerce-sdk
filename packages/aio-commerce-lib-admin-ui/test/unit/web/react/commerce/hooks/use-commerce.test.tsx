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
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, renderHook } from "vitest-browser-react";

import { mockConsole } from "#test/utils/console";
import { SharedContextProvider } from "#web/react/commerce/context/shared-context.tsx";
import { useCommerce } from "#web/react/commerce/hooks/use-commerce";

import type { ReactNode } from "react";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderNullFallback() {
  return null;
}

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

    expect(result.current.commerceHost).toBe("my-store.example.com");
    expect(getCommerceHost).toHaveBeenCalledTimes(1);
  });

  test("propagates the error to the error boundary when the host lacks the integration API", async () => {
    mockConsole("error");

    const connection = makeConnection({});
    const onError = vi.fn();

    function HookProbe() {
      useCommerce();
      return null;
    }

    await render(
      <SharedContextProvider
        extensionId="ext-use-commerce-no-integration"
        // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
        guestConnection={connection}>
        <ErrorBoundary fallbackRender={renderNullFallback} onError={onError}>
          <Suspense fallback={null}>
            <HookProbe />
          </Suspense>
        </ErrorBoundary>
      </SharedContextProvider>,
    );

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    const [error] = onError.mock.calls[0] as [Error];

    expect(error.message).toContain(
      "The host does not provide the integration API",
    );
  });
});
