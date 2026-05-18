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

// Supports one level of nested parens in URLs (e.g. Wikipedia-style links); deeper nesting is not needed for config descriptions.
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(((?:[^)(]|\([^)]*\))*)\)/g;
const SAFE_URL_RE = /^https?:\/\//i;

/**
 * Returns true if every Markdown link in the string uses an http(s) URL.
 * Any other scheme — including relative, protocol-relative, or empty — returns false.
 * Plain text with no Markdown links always returns true.
 */
export function validateMarkdownUrls(text: string): boolean {
  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    const url = match[2].trim();
    if (!SAFE_URL_RE.test(url)) {
      return false;
    }
  }
  return true;
}
