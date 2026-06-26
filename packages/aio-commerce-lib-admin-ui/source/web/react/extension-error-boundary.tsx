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

import { useRouterState } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";

import type { FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: Readonly<FallbackProps>) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
      <button onClick={resetErrorBoundary} type="button">
        Try again
      </button>
    </main>
  );
}

/**
 * A wrapper component that provides an error boundary for extension apps.
 * It catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI.
 *
 * @param props - The props for the component, including children elements.
 */
export function ExtensionErrorBoundary(
  props: Readonly<React.PropsWithChildren>,
) {
  const href = useRouterState({ select: (state) => state.location.href });
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[href]}>
      {props.children}
    </ErrorBoundary>
  );
}
