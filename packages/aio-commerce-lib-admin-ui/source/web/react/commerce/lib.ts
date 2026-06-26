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

const ORDER_ID_PATH_PARAM_PATTERN = /\/orderId\/([^/?#]+)/u;

/**
 * Extracts the order ID from a Commerce host URL. The host passes it as a Magento path parameter
 * (`.../orderId/<value>/`), not as a query string.
 *
 * @param href - The URL to read the order ID from (typically `window.location.href`).
 */
export function parseOrderId(href: string): string | null {
  const match = ORDER_ID_PATH_PARAM_PATTERN.exec(href);
  return match ? decodeURIComponent(match[1]) : null;
}
