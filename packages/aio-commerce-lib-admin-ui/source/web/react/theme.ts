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

type ColorScheme = "dark" | "light";

/**
 * Maps host theme values to Spectrum S2 color schemes.
 * @param theme - The theme value provided by the host runtime.
 */
export function getShellColorScheme(
  theme: string | null | undefined,
): ColorScheme | undefined {
  switch (theme) {
    case "dark":
    case "spectrum--darkest":
      return "dark";
    case "light":
    case "spectrum--lightest":
      return "light";
    default:
      return;
  }
}

/**
 * Syncs the root `data-color-scheme` attribute used by Spectrum S2 page styles.
 *
 * @param colorScheme - The Spectrum S2 color scheme to apply.
 */
export function syncRootColorScheme(colorScheme: ColorScheme | undefined) {
  if (!colorScheme) {
    delete document.documentElement.dataset.colorScheme;
    return;
  }

  document.documentElement.dataset.colorScheme = colorScheme;
}
