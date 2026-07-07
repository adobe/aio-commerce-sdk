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

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { stubStandaloneFrame } from "#test/utils/frame";
import { renderWithRouter } from "#test/utils/router.tsx";
import { StandaloneExtensionApp } from "#web/react/extension/standalone-app.tsx";

import type { RouteEntry } from "#web/react/routing/types";

const ROUTES: RouteEntry[] = [
  { index: true, element: <div data-testid="route-content" /> },
];

let restoreFrame: () => void = () => undefined;

beforeEach(() => {
  // Standalone means no host frame: the IMS provider then renders children with null credentials.
  restoreFrame = stubStandaloneFrame();
});

afterEach(() => {
  restoreFrame();
  delete document.documentElement.dataset.colorScheme;
});

describe("StandaloneExtensionApp", () => {
  test("renders the routed content and clears the root color scheme on mount", async () => {
    document.documentElement.dataset.colorScheme = "stale";

    const { screen } = await renderWithRouter(<StandaloneExtensionApp />, {
      routes: ROUTES,
    });

    await expect
      .element(screen.getByTestId("route-content"))
      .toBeInTheDocument();

    expect(document.documentElement.dataset.colorScheme).toBeUndefined();
  });
});
