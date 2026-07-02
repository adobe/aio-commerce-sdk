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

import { Provider } from "@react-spectrum/s2/Provider";
import { Outlet as ActiveRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { ImsContextProvider } from "#web/react/auth/context/ims-context.tsx";
import { useSpectrumRouter } from "#web/react/routing/hooks/use-spectrum-router";
import { syncRootColorScheme } from "#web/react/theme";

import { ExtensionErrorBoundary } from "./error-boundary";

/** Renders the raw HTML page running standalone, with no host frame at all. Nothing to wait on. */
export function StandaloneExtensionApp() {
  const spectrumRouter = useSpectrumRouter();

  useEffect(() => {
    syncRootColorScheme(undefined);
  }, []);

  return (
    <Provider colorScheme={undefined} router={spectrumRouter}>
      <ExtensionErrorBoundary>
        <ImsContextProvider credentials={null}>
          <ActiveRoute />
        </ImsContextProvider>
      </ExtensionErrorBoundary>
    </Provider>
  );
}
