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

import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useExtensionColorScheme } from "#web/react/shell/hooks/use-extension-color-scheme";

import type { ShellConfiguration } from "#web/react/shell/types";

const BASE: Omit<ShellConfiguration, "theme"> = {
  imsOrg: "org@AdobeOrg",
  imsToken: "token",
};

afterEach(() => {
  delete document.documentElement.dataset.colorScheme;
});

describe("useExtensionColorScheme", () => {
  test("derives the scheme from the configuration theme and syncs the root attribute", async () => {
    const { result } = await renderHook(() =>
      useExtensionColorScheme({ ...BASE, theme: "dark" }),
    );

    expect(result.current).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
  });

  test("returns undefined and clears the root attribute when the configuration is null", async () => {
    const { result } = await renderHook(() => useExtensionColorScheme(null));

    expect(result.current).toBeUndefined();
    expect(document.documentElement.dataset.colorScheme).toBeUndefined();
  });

  test("re-syncs only when the derived scheme changes", async () => {
    const { result, rerender } = await renderHook(
      ({ theme }: { theme: string } = { theme: "light" }) =>
        useExtensionColorScheme({ ...BASE, theme }),
      { initialProps: { theme: "light" } },
    );

    expect(document.documentElement.dataset.colorScheme).toBe("light");

    // A different theme value that maps to the same scheme must not re-run the effect:
    // the sentinel we write here should survive the rerender.
    document.documentElement.dataset.colorScheme = "sentinel";
    await rerender({ theme: "spectrum--lightest" });

    expect(result.current).toBe("light");
    expect(document.documentElement.dataset.colorScheme).toBe("sentinel");

    // A theme that changes the derived scheme re-runs the effect and overwrites the attribute.
    await rerender({ theme: "dark" });
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
  });
});
