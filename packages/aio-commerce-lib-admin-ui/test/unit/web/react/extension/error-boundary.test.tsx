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

import { mockConsole } from "#test/utils/console";
import { renderWithRouter } from "#test/utils/router.tsx";
import { ExtensionErrorBoundary } from "#web/react/extension/error-boundary.tsx";

/** A child component that throws the given value on render. */
function ThrowingChild({ error }: { error: unknown }): never {
  throw error;
}

describe("ExtensionErrorBoundary", () => {
  beforeEach(() => {
    mockConsole("error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders an Error's message in the fallback", async () => {
    const { screen } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ThrowingChild error={new Error("boom")} />
      </ExtensionErrorBoundary>,
    );

    await expect.element(screen.getByText("boom")).toBeInTheDocument();
  });

  test("renders a thrown string verbatim in the fallback", async () => {
    const { screen } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ThrowingChild error="just a string" />
      </ExtensionErrorBoundary>,
    );

    await expect.element(screen.getByText("just a string")).toBeInTheDocument();
  });

  test("renders a generic message for a non-error, non-string value", async () => {
    const { screen } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ThrowingChild error={42} />
      </ExtensionErrorBoundary>,
    );

    await expect
      .element(screen.getByText("An unexpected error occurred."))
      .toBeInTheDocument();
  });

  test("hides the 'Go back' button when the router cannot go back", async () => {
    // A single history entry means there is nowhere to go back to.
    const { screen } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ThrowingChild error={new Error("boom")} />
      </ExtensionErrorBoundary>,
      { initialEntries: ["/"] },
    );

    await expect.element(screen.getByText("boom")).toBeInTheDocument();
    await expect.element(screen.getByText("Go back")).not.toBeInTheDocument();
  });

  test("shows the 'Go back' button and navigates back on press when possible", async () => {
    // A seeded history stack makes useCanGoBack() genuinely true.
    const { screen, router } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ThrowingChild error={new Error("boom")} />
      </ExtensionErrorBoundary>,
      { initialEntries: ["/first", "/second"] },
    );

    expect(router.state.location.pathname).toBe("/second");
    await screen.getByText("Go back").click();

    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe("/first"),
    );
  });

  test("recovers via 'Try again' by resetting the error boundary", async () => {
    // The flag lives outside the component so it survives the reset remount.
    const retryState: { shouldThrow: boolean } = { shouldThrow: true };
    function ToggleChild() {
      if (retryState.shouldThrow) {
        throw new Error("boom");
      }

      return <div>recovered</div>;
    }

    const { screen } = await renderWithRouter(
      <ExtensionErrorBoundary>
        <ToggleChild />
      </ExtensionErrorBoundary>,
    );

    await expect.element(screen.getByText("boom")).toBeInTheDocument();
    retryState.shouldThrow = false;

    await screen.getByText("Try again").click();
    await expect.element(screen.getByText("recovered")).toBeInTheDocument();
  });
});
