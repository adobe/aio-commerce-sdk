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

import { afterEach, describe, expect, test, vi } from "vitest";
import { render, renderHook } from "vitest-browser-react";

import { stubControlFrame, stubStandaloneFrame } from "#test/utils/frame";
import {
  ImsContextProvider,
  useIms,
} from "#web/react/auth/context/ims-context.tsx";

import type { ReactNode } from "react";

const CREDENTIALS = { imsOrgId: "o", imsToken: "t" };

let restoreFrame: () => void = () => undefined;
afterEach(() => {
  restoreFrame();
  vi.restoreAllMocks();
});

describe("useIms", () => {
  test("returns an error when used outside an ImsContextProvider", async () => {
    const { result } = await renderHook(() => useIms());

    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toBe(
      "useIms must be used inside an ImsContextProvider.",
    );
  });

  test("returns the credentials provided by the ImsContextProvider", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ImsContextProvider credentials={CREDENTIALS}>
        {children}
      </ImsContextProvider>
    );

    const { result } = await renderHook(() => useIms(), { wrapper });
    expect(result.current).toEqual({ data: CREDENTIALS, error: null });
  });

  test("renders children but returns an error when credentials are null and not embedded", async () => {
    restoreFrame = stubStandaloneFrame();

    const screen = await render(
      <ImsContextProvider credentials={null}>
        <div data-testid="child" />
      </ImsContextProvider>,
    );

    await expect.element(screen.getByTestId("child")).toBeInTheDocument();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ImsContextProvider credentials={null}>{children}</ImsContextProvider>
    );

    const { result } = await renderHook(() => useIms(), { wrapper });
    expect.assert.isNull(result.current.data);
    expect(result.current.error.message).toContain(
      "useIms requires running inside the Commerce Admin or the Experience Cloud shell",
    );
  });
});

describe("ImsContextProvider", () => {
  test("withholds children while embedded in a host and credentials are null (loading)", async () => {
    restoreFrame = stubControlFrame();

    const screen = await render(
      <ImsContextProvider credentials={null}>
        <div data-testid="child" />
      </ImsContextProvider>,
    );

    await expect.element(screen.getByTestId("child")).not.toBeInTheDocument();
  });
});
