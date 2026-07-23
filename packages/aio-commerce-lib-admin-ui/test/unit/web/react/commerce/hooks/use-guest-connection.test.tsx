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

import { attach } from "@adobe/uix-guest";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, renderHook } from "vitest-browser-react";

import { createMockGuestConnection } from "#test/fixtures/uix-guest";
import { mockConsole } from "#test/utils/console";
import { useGuestConnection } from "#web/react/commerce/hooks/use-guest-connection";

import type { ReactNode } from "react";

vi.mock("@adobe/uix-guest", () => ({ attach: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();

  // `attach` is a module mock, not a spy, so `restoreAllMocks` leaves its call history intact;
  // clear it so per-test call-count assertions don't accumulate across tests.
  vi.clearAllMocks();
});

function renderNullFallback() {
  return null;
}

const suspenseWrapper = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

// The module-level promise cache in `use-guest-connection` is keyed by `extensionId`,
// so each test uses a unique ID to avoid cross-test cache hits.
describe("useGuestConnection", () => {
  test("suspends and resolves to the attached guest connection", async () => {
    const connection = createMockGuestConnection({ host: { integration: {} } });

    // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
    vi.mocked(attach).mockResolvedValue(connection);
    const { result } = await renderHook(
      () => useGuestConnection("ext-use-guest-happy"),
      { wrapper: suspenseWrapper },
    );

    await vi.waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current).toBe(connection);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith({ id: "ext-use-guest-happy" });
  });

  test("reuses the cached promise for the same extensionId across multiple hooks", async () => {
    const connection = createMockGuestConnection({ host: { integration: {} } });

    // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
    vi.mocked(attach).mockResolvedValue(connection);
    const first = await renderHook(
      () => useGuestConnection("ext-use-guest-cached"),
      { wrapper: suspenseWrapper },
    );

    const second = await renderHook(
      () => useGuestConnection("ext-use-guest-cached"),
      { wrapper: suspenseWrapper },
    );

    await vi.waitFor(() => expect(first.result.current).not.toBeNull());
    await vi.waitFor(() => expect(second.result.current).not.toBeNull());

    expect(first.result.current).toBe(connection);
    expect(second.result.current).toBe(connection);
    expect(attach).toHaveBeenCalledTimes(1);
  });

  test("logs and propagates an attach rejection to the error boundary", async () => {
    const consoleError = mockConsole("error");

    const attachError = new Error("attach boom");
    vi.mocked(attach).mockRejectedValue(attachError);

    const onError = vi.fn();

    function HookProbe() {
      useGuestConnection("ext-use-guest-error");
      return null;
    }

    await render(
      <ErrorBoundary fallbackRender={renderNullFallback} onError={onError}>
        <Suspense fallback={null}>
          <HookProbe />
        </Suspense>
      </ErrorBoundary>,
    );

    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    const [error] = onError.mock.calls[0] as [Error];
    expect(error).toBe(attachError);

    expect(consoleError).toHaveBeenCalledWith(
      "UIX guest attach failed:",
      attachError,
    );
  });
});
