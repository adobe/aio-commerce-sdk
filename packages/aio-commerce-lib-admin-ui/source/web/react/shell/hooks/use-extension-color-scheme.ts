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

import { useEffect } from "react";

import { useInternalSharedContext } from "#web/react/commerce/context/shared-context.tsx";
import { getExtensionColorScheme, syncRootColorScheme } from "#web/react/theme";

import type { ShellConfiguration } from "#web/react/shell/types";

/**
 * Keeps the Spectrum S2 color scheme aligned with Commerce, Experience Shell, or browser defaults.
 * @param shellConfiguration - The Experience Shell configuration, if available.
 */
export function useExtensionColorScheme(
  shellConfiguration: ShellConfiguration | null,
) {
  const { sharedContext } = useInternalSharedContext();
  const isEmbeddedOutsideExperienceShell =
    globalThis.parent !== globalThis.window && shellConfiguration === null;

  const colorScheme = getExtensionColorScheme(
    // We assume we are running in Commerce based on this condition, it probably can be improved in the future.
    sharedContext !== null || isEmbeddedOutsideExperienceShell,
    shellConfiguration?.theme,
  );

  useEffect(() => {
    syncRootColorScheme(colorScheme);
  }, [colorScheme]);

  return colorScheme;
}
