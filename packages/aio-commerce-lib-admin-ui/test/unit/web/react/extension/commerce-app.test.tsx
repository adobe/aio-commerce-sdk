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

import { attach, register } from "@adobe/uix-guest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createMockGuestConnection } from "#test/fixtures/uix-guest";
import { mockConsole } from "#test/utils/console";
import { stubControlFrame, stubUiFrame } from "#test/utils/frame";
import { renderWithRouter } from "#test/utils/router.tsx";
import { CommerceExtensionApp } from "#web/react/extension/commerce-app.tsx";

import type { RouteEntry } from "#web/react/routing/types";

// @adobe/uix-guest reaches a real uix-host across the iframe bridge; it is the only external boundary faked here.
vi.mock("@adobe/uix-guest", async () =>
  (await import("#test/fixtures/uix-guest")).uixGuestMock(),
);

const ROUTES: RouteEntry[] = [
  { element: <div data-testid="route-content" />, index: true },
];

function mockAttachedConnection() {
  vi.mocked(attach).mockResolvedValue(
    // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
    createMockGuestConnection({
      sharedContext: new Map<string, unknown>([
        ["imsToken", "t"],
        ["imsOrgId", "o"],
      ]),
    }),
  );
}

let restoreFrame: () => void = () => undefined;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  restoreFrame();
  delete document.documentElement.dataset.colorScheme;
  vi.restoreAllMocks();
});

describe("CommerceExtensionApp", () => {
  test("renders the routed UI frame tree once the guest connection attaches", async () => {
    restoreFrame = stubUiFrame();
    mockAttachedConnection();

    const { screen } = await renderWithRouter(
      <CommerceExtensionApp extensionId="ext-ui" />,
      { routes: ROUTES },
    );

    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(attach).toHaveBeenCalledWith({ id: "ext-ui" });
  });

  test("syncs the root color scheme to light on mount", async () => {
    restoreFrame = stubUiFrame();
    mockAttachedConnection();

    await renderWithRouter(<CommerceExtensionApp extensionId="ext-color" />, {
      routes: ROUTES,
    });

    await vi.waitFor(() =>
      expect(document.documentElement.dataset.colorScheme).toBe("light"),
    );
  });

  test("registers the control frame once per extension id and renders no content", async () => {
    restoreFrame = stubControlFrame();
    // @ts-expect-error -- the resolved guest server handle is unused by these tests
    vi.mocked(register).mockResolvedValue(undefined);

    const { screen } = await renderWithRouter(
      <CommerceExtensionApp extensionId="ext-cf-memo" />,
      { routes: ROUTES },
    );

    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        id: "ext-cf-memo",
        methods: {},
      }),
    );

    await expect
      .element(screen.getByTestId("route-content"))
      .not.toBeInTheDocument();

    // The registration is memoized per extension id, so a remount must not register again.
    await renderWithRouter(<CommerceExtensionApp extensionId="ext-cf-memo" />, {
      routes: ROUTES,
    });

    expect(register).toHaveBeenCalledTimes(1);
  });

  test("logs when the control frame registration rejects", async () => {
    const consoleError = mockConsole("error");

    const err = new Error("register failed");
    vi.mocked(register).mockRejectedValue(err);
    restoreFrame = stubControlFrame();

    await renderWithRouter(
      <CommerceExtensionApp extensionId="ext-cf-reject" />,
      {
        routes: ROUTES,
      },
    );

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "UIX guest register failed:",
        err,
      ),
    );
  });
});
