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
import { stubShellFrame } from "#test/utils/frame";
import { renderWithRouter } from "#test/utils/router.tsx";
import { ExperienceShellExtensionApp } from "#web/react/extension/experience-shell-app.tsx";

import type { RuntimeConfiguration } from "@adobe/exc-app";
import type { RouteEntry } from "#web/react/routing/types";

const ROUTES: RouteEntry[] = [
  { element: <div data-testid="route-content" />, index: true },
];

// The runtime is the exc-app boundary; a minimal fake EventEmitter is enough.
const runtime = createMockRuntime();

function renderApp(
  initialConfigurationPromise: Promise<RuntimeConfiguration | null>,
) {
  return renderWithRouter(
    <ExperienceShellExtensionApp
      initialConfigurationPromise={initialConfigurationPromise}
      runtime={runtime}
    />,
    { routes: ROUTES },
  );
}

let restoreFrame: () => void = () => undefined;

beforeEach(() => {
  // The shell runs embedded; the IMS provider renders children once credentials resolve.
  restoreFrame = stubShellFrame();
  vi.clearAllMocks();
});

afterEach(() => {
  restoreFrame();
  delete document.documentElement.dataset.colorScheme;
  vi.restoreAllMocks();
});

describe("ExperienceShellExtensionApp", () => {
  test("shows the shell fallback while the configuration promise is pending", async () => {
    const { screen } = await renderApp(new Promise(() => undefined));
    await expect
      .element(
        screen.getByRole("progressbar", {
          name: "Loading experience cloud runtime",
        }),
      )
      .toBeInTheDocument();
  });

  test("renders the routed content and applies the theme once the promise resolves", async () => {
    const { screen } = await renderApp(
      Promise.resolve({
        imsOrg: "o",
        imsToken: "t",
        theme: "dark",
      } as RuntimeConfiguration),
    );

    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(document.documentElement.dataset.colorScheme).toBe("dark");
    expect(runtime.on).toHaveBeenCalledWith(
      "configuration",
      expect.any(Function),
    );
  });
});
