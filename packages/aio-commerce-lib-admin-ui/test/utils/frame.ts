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

/** Frame modes recognized by the extension entrypoint. */
export type FrameMode = "ui" | "control" | "standalone" | "shell";

const ORIGINAL_PARENT = globalThis.window.parent;

function setParent(parent: Window) {
  Object.defineProperty(globalThis.window, "parent", {
    value: parent,
    configurable: true,
  });
}

/**
 * Drives the real frame detection (`#web/react/commerce/lib`) by setting
 * `window.parent`/`window.name` instead of mocking the module. Browser mode runs
 * tests in an iframe, so `window.parent !== window` by default — the standalone and
 * shell cases must explicitly pin `window.parent` back to `window`.
 *
 * Pair with {@link restoreFrame} in an `afterEach`.
 *
 * @param mode - Which frame the app should detect.
 */
export function stubFrame(mode: FrameMode) {
  switch (mode) {
    case "ui":
      setParent({} as Window);
      globalThis.window.name = "uix-guest-1";
      break;
    case "control":
      setParent({} as Window);
      globalThis.window.name = "";
      break;
    case "standalone":
    case "shell":
      setParent(globalThis.window);
      globalThis.window.name = "";
      break;
    default:
      throw new Error(`Unknown frame mode: ${mode}`);
  }
}

/** Restores `window.parent`/`window.name` after a {@link stubFrame} call. */
export function restoreFrame() {
  setParent(ORIGINAL_PARENT);
  globalThis.window.name = "";
}
