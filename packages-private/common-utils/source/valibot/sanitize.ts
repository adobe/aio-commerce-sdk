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

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(((?:[^)(]|\([^)]*\))*)\)/g;
const SAFE_URL_RE = /^https?:\/\//i;

/**
 * Strips non-http(s) URLs from Markdown link syntax in a string.
 * Links with `javascript:`, `data:`, relative paths, or any non-http(s)
 * scheme have their URL removed while preserving the label text.
 */
export function sanitizeMarkdownUrls(text: string): string {
  return text.replace(MARKDOWN_LINK_RE, (match, label: string, url: string) =>
    SAFE_URL_RE.test(url.trim()) ? match : `[${label}]()`,
  );
}
