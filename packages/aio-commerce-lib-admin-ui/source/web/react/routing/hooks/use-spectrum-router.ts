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
import { useMemo } from "react";

import { getRouteTo } from "#web/react/routing/lib";

import type { NavigateOptions, ToOptions } from "@tanstack/react-router";

/**
 * Sets up a router instance for an extension app, based on the TanStack React Router example of React Spectrum.
 * @see https://react-spectrum.adobe.com/getting-started
 */
export function useSpectrumRouter() {
  const router = useRouter();
  const spectrumRouter = useMemo(
    () => ({
      navigate: (
        href: ToOptions | string,
        options?: Omit<NavigateOptions, keyof ToOptions>,
      ) => {
        if (typeof href === "string") {
          return router.navigate({ to: getRouteTo(href), ...options });
        }

        return router.navigate({ ...href, ...options });
      },
      useHref: (href: ToOptions | string) => {
        if (typeof href === "string") {
          return href;
        }

        return router.buildLocation(href).href;
      },
    }),
    [router],
  );

  return spectrumRouter;
}
