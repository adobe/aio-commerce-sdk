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

/**
 * Extracts the order ID from the given URL (must be absolute).
 * @param href - The URL to read the order ID from (typically `window.location.href`).
 */
export function parseOrderId(href: string): string | null {
  const urlObj = new URL(href);
  return (
    urlObj.searchParams.get("orderId") ??
    new URLSearchParams(urlObj.hash.split("?")[1]).get("orderId")
  );
}

/** Whether the app is embedded in a host frame (the Commerce Admin or the Experience Cloud shell). */
export function isEmbeddedInHost(): boolean {
  return globalThis.window.parent !== globalThis.window;
}

/** Whether this window is a Commerce UIX guest UI frame, as opposed to a control frame or standalone. */
export function isUiFrame(): boolean {
  return isEmbeddedInHost() && window.name.startsWith("uix-guest-");
}

/** Whether this window is a Commerce UIX guest control frame, which registers instead of attaching. */
export function isControlFrame(): boolean {
  return isEmbeddedInHost() && !window.name;
}
