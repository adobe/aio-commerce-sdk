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

import { Button, ButtonGroup } from "@react-spectrum/s2/ButtonGroup";
import {
  Content,
  Heading,
  IllustratedMessage,
} from "@react-spectrum/s2/IllustratedMessage";
import ErrorIllustration from "@react-spectrum/s2/illustrations/linear/Error";
import {
  useCanGoBack,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";

import type { FallbackProps } from "react-error-boundary";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "An unexpected error occurred.";
}

function ErrorFallback({ error, resetErrorBoundary }: Readonly<FallbackProps>) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const goBack = useCallback(() => {
    router.history.back();
  }, [router]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",

        // Subtract the padding to avoid generating overflow
        minHeight: "calc(100dvh - 48px)",
        padding: 24,
      }}>
      <IllustratedMessage>
        <ErrorIllustration />
        <Heading>Something went wrong</Heading>
        <Content>{getErrorMessage(error)}</Content>
        <ButtonGroup>
          {canGoBack && (
            <Button onPress={goBack} variant="secondary">
              Go back
            </Button>
          )}
          <Button onPress={resetErrorBoundary} variant="accent">
            Try again
          </Button>
        </ButtonGroup>
      </IllustratedMessage>
    </div>
  );
}

/**
 * A wrapper component that provides an error boundary for extension apps.
 * It catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI.
 *
 * @param props - The props for the component, including children elements and an optional
 * `onReset` callback run before the boundary re-renders its children (via "Try again" or a
 * route change), e.g. to drop cached failures so a retry starts fresh.
 */
export function ExtensionErrorBoundary(
  props: Readonly<React.PropsWithChildren<{ onReset?: () => void }>>,
) {
  const routeKey = useRouterState({
    select: (state) => state.matches.at(-1)?.pathname,
  });

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={props.onReset}
      resetKeys={[routeKey]}>
      {props.children}
    </ErrorBoundary>
  );
}
