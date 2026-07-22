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

function setParent(parent: Window) {
  Object.defineProperty(globalThis.window, "parent", {
    configurable: true,
    value: parent,
  });
}

/** The two orthogonal axes that drive frame detection in `#web/react/commerce/lib`. */
type FrameOptions = {
  /** Whether the app runs inside a host frame (`window.parent !== window`). */
  embedded: boolean;
  /** The `window.name` the host assigns; a `uix-guest-*` name marks a UI frame. */
  name?: string;
};

/**
 * Drives the real frame detection by stubbing `window.parent`/`window.name`, instead
 * of mocking the module. Browser mode runs tests in an iframe, so `window.parent !== window`
 * by default — this pins both axes explicitly. Prefer the named helpers below; reach for
 * this primitive only for states they don't express (e.g. embedded with an unrelated name).
 *
 * @param options - The frame's embedded state and host-assigned name.
 * @returns A function that restores the previous `window.parent`/`window.name`.
 */
export function stubFrame({ embedded, name = "" }: FrameOptions) {
  const previousParent = globalThis.window.parent;
  const previousName = globalThis.window.name;

  setParent(embedded ? ({} as Window) : globalThis.window);
  globalThis.window.name = name;

  return () => {
    setParent(previousParent);
    globalThis.window.name = previousName;
  };
}

/** Embedded UI frame (uix-guest name): `isUiFrame()` reports true. */
export function stubUiFrame(name = "uix-guest-1") {
  return stubFrame({ embedded: true, name });
}

/** Embedded control frame (no name): `isControlFrame()` reports true. */
export function stubControlFrame() {
  return stubFrame({ embedded: true, name: "" });
}

/** Top-level standalone window (not embedded). */
export function stubStandaloneFrame(name = "") {
  return stubFrame({ embedded: false, name });
}

/** Embedded in the Experience Cloud shell iframe: neither a UI nor a control frame. */
export function stubShellFrame() {
  // A name that is neither a uix-guest name nor empty keeps isUiFrame/isControlFrame false, so
  // the shell flow is reached; it still needs a non-null initial configuration promise to render.
  return stubFrame({ embedded: true, name: "exc-app" });
}
