/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/** biome-ignore-all lint/suspicious/useAwait: To mock with the same signature as the original method */

import { vi } from "vitest";

export function createMockLibFiles() {
  const MockLibFiles = vi.fn(
    class MockLibFilesClass {
      private files = new Map<string, string>();

      public list = vi.fn(async (path?: string) => {
        if (!path) {
          return [];
        }

        // Return all files that start with the path
        const matchingFiles = Array.from(this.files.keys())
          .filter((key) => key.startsWith(path))
          .map((key) => ({ name: key }));

        return matchingFiles;
      });

      public read = vi.fn(async (path: string) =>
        Buffer.from(this.files.get(path) || "{}"),
      );

      public write = vi.fn(
        async (
          path: string,
          content: string | Buffer | NodeJS.ReadableStream,
        ) => {
          const contentString = content.toString();
          const bytes = contentString.length;
          this.files.set(path, contentString);

          return bytes;
        },
      );
    },
  );

  return MockLibFiles;
}
