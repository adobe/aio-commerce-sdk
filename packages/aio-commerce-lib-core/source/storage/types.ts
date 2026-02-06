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
 * Generic key-value store interface.
 * @typeParam T - The type of data stored.
 */
export interface KeyValueStore<T> {
  /**
   * Retrieves data by key.
   *
   * @param key - The key to retrieve.
   * @returns The data or null if not found.
   */
  get(key: string): Promise<T | null>;

  /**
   * Saves data with the given key.
   *
   * @param key - The key to save under.
   * @param data - The data to save.
   */
  put(key: string, data: T): Promise<void>;

  /**
   * Deletes data by key.
   *
   * @param key - The key to delete.
   * @returns True if the key existed and was deleted.
   */
  delete?(key: string): Promise<boolean>;
}

/**
 * Function to extract a key from data.
 * Used when saving data without explicitly providing a key.
 */
export type KeyExtractor<T> = (data: T) => string;

/**
 * Predicate function to determine if data should be persisted.
 * Used by combined stores to decide when to write to persistent storage.
 */
export type PersistPredicate<T> = (data: T) => boolean;

/**
 * Options for creating a lib-state based store.
 */
export type StateStoreOptions = {
  /** Key prefix for all entries. */
  keyPrefix?: string;
  /** TTL in seconds for cached entries. */
  ttlSeconds?: number;
};

/**
 * Options for creating a lib-files based store.
 */
export type FilesStoreOptions = {
  /** Directory prefix for all files. */
  dirPrefix?: string;
};

/**
 * Options for creating a combined store.
 */
export type CombinedStoreOptions<T> = {
  /** Options for the cache (lib-state) store. */
  cache?: StateStoreOptions;

  /** Options for the persistent (lib-files) store. */
  persistent?: FilesStoreOptions & {
    /**
     * Predicate to determine if data should be persisted.
     * If not provided, all data is persisted.
     */
    shouldPersist?: PersistPredicate<T>;
  };
};
