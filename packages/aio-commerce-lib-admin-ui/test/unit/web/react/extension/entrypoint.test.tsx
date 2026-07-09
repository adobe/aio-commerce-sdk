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

import { createMockRuntime } from "#test/fixtures/exc-app";
import { createMockGuestConnection } from "#test/fixtures/uix-guest";
import {
  stubControlFrame,
  stubShellFrame,
  stubStandaloneFrame,
  stubUiFrame,
} from "#test/utils/frame";
import { renderWithRouter } from "#test/utils/router.tsx";
import { Entrypoint } from "#web/react/extension/entrypoint.tsx";

import type { RuntimeConfiguration } from "@adobe/exc-app";
import type { RouteEntry } from "#web/react/routing/types";

// @adobe/uix-guest reaches a real uix-host across the iframe bridge; it is the only external boundary faked here.
vi.mock("@adobe/uix-guest", async () =>
  (await import("#test/fixtures/uix-guest")).uixGuestMock(),
);

const ROUTES: RouteEntry[] = [
  { element: <div data-testid="route-content" />, index: true },
];

function renderEntrypoint(
  extensionId: string,
  runtime: ReturnType<typeof createMockRuntime>,
  initialConfigurationPromise: Promise<RuntimeConfiguration | null> | null,
) {
  return renderWithRouter(
    <Entrypoint
      extensionId={extensionId}
      initialConfigurationPromise={initialConfigurationPromise}
      runtime={runtime}
    />,
    { routes: ROUTES },
  );
}

let restoreFrame: () => void = () => undefined;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  restoreFrame();
  vi.restoreAllMocks();
});

describe("Entrypoint", () => {
  test("renders the Commerce app (UI frame) and attaches the guest connection", async () => {
    restoreFrame = stubUiFrame();

    vi.mocked(attach).mockResolvedValue(
      // @ts-expect-error -- fake connection cannot satisfy the uix-guest GuestConnection type
      createMockGuestConnection({
        sharedContext: new Map<string, unknown>([
          // Both IMS keys are required, else the IMS provider withholds children and content never renders.
          ["imsToken", "t"],
          ["imsOrgId", "o"],
        ]),
      }),
    );

    const { screen } = await renderEntrypoint(
      "ext-ui",
      createMockRuntime(),
      null,
    );

    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(attach).toHaveBeenCalledWith({ id: "ext-ui" });
  });

  test("renders the Commerce app (control frame) which registers and shows no content", async () => {
    restoreFrame = stubControlFrame();

    // @ts-expect-error -- the resolved guest server handle is unused by these tests
    vi.mocked(register).mockResolvedValue(undefined);
    const { screen } = await renderEntrypoint(
      "ext-control",
      createMockRuntime(),
      Promise.resolve(null),
    );

    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith({ id: "ext-control", methods: {} }),
    );

    await expect
      .element(screen.getByTestId("route-content"))
      .not.toBeInTheDocument();
  });

  test("renders the standalone app when not embedded with no configuration promise", async () => {
    restoreFrame = stubStandaloneFrame();

    const runtime = createMockRuntime();
    const { screen } = await renderEntrypoint("ext-standalone", runtime, null);

    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(attach).not.toHaveBeenCalled();
    expect(runtime.on).not.toHaveBeenCalled();
  });

  test("renders the Experience Cloud shell app, subscribing to the runtime", async () => {
    restoreFrame = stubShellFrame();

    const runtime = createMockRuntime();
    const promise: Promise<RuntimeConfiguration | null> = Promise.resolve({
      imsOrg: "o",
      imsToken: "t",
      theme: "light",
    } as RuntimeConfiguration);

    const { screen } = await renderEntrypoint("ext-shell", runtime, promise);
    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(runtime.on).toHaveBeenCalled();
    expect(attach).not.toHaveBeenCalled();
  });
});
