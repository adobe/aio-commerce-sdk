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
  props: Readonly<React.PropsWithChildren<void>>,
) {
  const href = useRouterState({ select: (state) => state.location.href });
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[href]}>
      {props.children}
    </ErrorBoundary>
  );
}
