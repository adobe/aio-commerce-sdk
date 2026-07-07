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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createMockRuntime } from "#test/fixtures/exc-app";
import { renderHookWithRouter } from "#test/utils/router.tsx";
import { useShellConfiguration } from "#web/react/shell/hooks/use-shell-configuration";

import type { RouteEntry } from "#web/react/routing/types";

const CURRENT_PATHNAME = "/current";

const ROUTES: RouteEntry[] = [
  { index: true, element: null },
  { path: "current", element: null },
  { path: "other", element: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useShellConfiguration", () => {
  test("derives the initial state from the initial configuration", async () => {
    const runtime = createMockRuntime();
    const initial = {
      imsOrg: "org@AdobeOrg",
      imsToken: "token",
      theme: "dark",
      locale: "en-US",
    };

    const { result } = await renderHookWithRouter(() =>
      // @ts-expect-error -- fakes cannot satisfy the exc-app Runtime/RuntimeConfiguration types
      useShellConfiguration(runtime, initial),
    );

    expect(result.current).toEqual({
      imsOrg: "org@AdobeOrg",
      imsToken: "token",
      theme: "dark",
    });
  });

  test("starts with a null state when no initial configuration is provided", async () => {
    const runtime = createMockRuntime();
    const { result } = await renderHookWithRouter(() =>
      useShellConfiguration(runtime, null),
    );

    expect(result.current).toBeNull();
  });

  test("ignores a falsy configuration event and keeps the previous state", async () => {
    const runtime = createMockRuntime();
    const { result } = await renderHookWithRouter(() =>
      useShellConfiguration(runtime, null),
    );

    runtime.handlers.configuration(undefined);
    expect(result.current).toBeNull();
  });

  test("updates the state on a truthy configuration event", async () => {
    const runtime = createMockRuntime();
    const { result } = await renderHookWithRouter(() =>
      useShellConfiguration(runtime, null),
    );

    runtime.handlers.configuration({
      imsOrg: "org@AdobeOrg",
      imsToken: "token",
      theme: "light",
      locale: "en-US",
    });

    await vi.waitFor(() =>
      expect(result.current).toEqual({
        imsOrg: "org@AdobeOrg",
        imsToken: "token",
        theme: "light",
      }),
    );
  });

  test("navigates on an external history event to a different route", async () => {
    const runtime = createMockRuntime();
    const { router } = await renderHookWithRouter(
      () => useShellConfiguration(runtime, null),
      { routes: ROUTES, initialEntries: [CURRENT_PATHNAME] },
    );

    runtime.handlers.history({ type: "external", path: "/other" });

    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe("/other"),
    );
  });

  test("skips navigation when the target route matches the current pathname", async () => {
    const runtime = createMockRuntime();
    const { router } = await renderHookWithRouter(
      () => useShellConfiguration(runtime, null),
      { routes: ROUTES, initialEntries: [CURRENT_PATHNAME] },
    );

    const navigate = vi.spyOn(router, "navigate");
    runtime.handlers.history({ type: "external", path: CURRENT_PATHNAME });

    expect(navigate).not.toHaveBeenCalled();
  });

  test("ignores non-external history events", async () => {
    const runtime = createMockRuntime();
    const { router } = await renderHookWithRouter(
      () => useShellConfiguration(runtime, null),
      { routes: ROUTES, initialEntries: [CURRENT_PATHNAME] },
    );

    const navigate = vi.spyOn(router, "navigate");
    runtime.handlers.history({ type: "internal", path: "/other" });

    expect(navigate).not.toHaveBeenCalled();
  });

  test("ignores history events without a string path", async () => {
    const runtime = createMockRuntime();
    const { router } = await renderHookWithRouter(
      () => useShellConfiguration(runtime, null),
      { routes: ROUTES, initialEntries: [CURRENT_PATHNAME] },
    );

    const navigate = vi.spyOn(router, "navigate");
    runtime.handlers.history({ type: "external" });

    expect(navigate).not.toHaveBeenCalled();
  });

  test("subscribes on mount and unsubscribes on unmount", async () => {
    const runtime = createMockRuntime();
    const { screen } = await renderHookWithRouter(() =>
      useShellConfiguration(runtime, null),
    );

    expect(runtime.on).toHaveBeenCalledWith("history", expect.any(Function));
    expect(runtime.on).toHaveBeenCalledWith(
      "configuration",
      expect.any(Function),
    );

    await screen.unmount();
    expect(runtime.off).toHaveBeenCalledWith(
      "configuration",
      expect.any(Function),
    );

    expect(runtime.off).toHaveBeenCalledWith("history", expect.any(Function));
  });
});
