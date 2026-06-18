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

import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getRouteTo } from "#web/react/routing/lib";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";

/** Defines the small subset of runtime configuration that extensions have access to */
export type ShellConfiguration = Pick<
  RuntimeConfiguration,
  "imsOrg" | "imsToken" | "imsProfile" | "locale"
>;

/**
 * Extracts the shell configuration from the runtime configuration.
 * @param config The runtime configuration object.
 */
export function extractShellConfiguration(
  config: RuntimeConfiguration,
): ShellConfiguration {
  const { imsOrg, imsToken, imsProfile, locale } = config;
  return { imsOrg, imsToken, imsProfile, locale };
}

/**
 * Derives the exposed shell configuration from the given runtime instance.
 * @param runtime The runtime instance.
 */
export function useShellConfiguration(
  runtime: Runtime,
  initialConfiguration: RuntimeConfiguration | null,
) {
  const router = useRouter();
  const [shellConfiguration, setShellConfiguration] =
    useState<ShellConfiguration | null>(() =>
      initialConfiguration
        ? extractShellConfiguration(initialConfiguration)
        : null,
    );

  useEffect(() => {
    // EXC Runtime is an EventEmitter; RuntimeConfiguration carries imsOrg/imsToken/locale.
    // Docs: https://github.com/AdobeDocs/exc-app/blob/main/docs/interfaces/root.runtime.md#on
    // Docs: https://github.com/AdobeDocs/exc-app/blob/main/docs/interfaces/root.runtimeconfiguration.md
    const onConfiguration = (event?: RuntimeConfiguration) => {
      if (event) {
        setShellConfiguration(extractShellConfiguration(event));
      }
    };

    // Unified Shell uses hash navigation; Commerce Admin UI v1 samples subscribe to runtime "history".
    // Docs: https://github.com/AdobeDocs/exc-app/blob/main/docs/interfaces/page.pageapi.md#blocknavigation
    const onHistory = (event?: { path?: string; type?: string }) => {
      if (event?.type === "external" && typeof event.path === "string") {
        const to = getRouteTo(event.path);
        if (to !== router.state.location.pathname) {
          router.navigate({ to });
        }
      }
    };

    runtime.on("configuration", onConfiguration);
    runtime.on("history", onHistory);

    return () => {
      runtime.off("configuration", onConfiguration);
      runtime.off("history", onHistory);
    };
  }, [router, runtime]);

  return shellConfiguration;
}
