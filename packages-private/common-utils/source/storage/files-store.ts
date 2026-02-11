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

import { init as initFiles } from "@adobe/aio-lib-files";

import type { Files } from "@adobe/aio-lib-files";
import type { FilesStoreOptions, KeyValueStore } from "./types";

/** Default directory prefix. */
const DEFAULT_DIR_PREFIX = "store";

/**
 * Creates a generic key-value store backed by @adobe/aio-lib-files.
 * Provides persistent storage that survives beyond TTL.
 *
 * @typeParam T - The type of data to store.
 * @param options - Configuration options for the store.
 * @returns A KeyValueStore implementation.
 *
 * @example
 * ```typescript
 * interface UserProfile {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const store = await createFilesStore<UserProfile>({
 *   dirPrefix: "profiles",
 * });
 *
 * await store.put("user-123", { id: "123", name: "John", email: "john@example.com" });
 * const profile = await store.get("user-123");
 * ```
 */
export async function createFilesStore<T>(
  options: FilesStoreOptions = {},
): Promise<KeyValueStore<T>> {
  const { dirPrefix = DEFAULT_DIR_PREFIX } = options;

  const files = await initFiles();
  return new FilesStore<T>(files, dirPrefix);
}

/**
 * Key-value store implementation using @adobe/aio-lib-files.
 */
class FilesStore<T> implements KeyValueStore<T> {
  private readonly files: Files;
  private readonly dirPrefix: string;

  public constructor(files: Files, dirPrefix: string) {
    this.files = files;
    this.dirPrefix = dirPrefix;
  }

  public async get(key: string): Promise<T | null> {
    const filePath = this.buildFilePath(key);
    try {
      const content = await this.files.read(filePath);
      if (!content) {
        return null;
      }

      return JSON.parse(content.toString("utf8")) as T;
    } catch {
      // File doesn't exist or read error
      return null;
    }
  }

  public async put(key: string, data: T): Promise<void> {
    const filePath = this.buildFilePath(key);
    await this.files.write(filePath, JSON.stringify(data));
  }

  public async delete(key: string): Promise<boolean> {
    const filePath = this.buildFilePath(key);

    try {
      const result = await this.files.delete(filePath);
      return Array.isArray(result) && result.length > 0;
    } catch {
      return false;
    }
  }

  private buildFilePath(key: string): string {
    return `${this.dirPrefix}/${key}.json`;
  }
}
