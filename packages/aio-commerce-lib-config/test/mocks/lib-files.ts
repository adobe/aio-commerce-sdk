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
