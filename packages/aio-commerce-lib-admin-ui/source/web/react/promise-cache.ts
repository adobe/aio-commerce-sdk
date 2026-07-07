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

type RetryablePromiseCache<T> = {
  /** Returns the cached promise for `key`, or runs `create` to produce and cache one on a miss. */
  get: (key: string, create: () => Promise<T>) => Promise<T>;

  /** Drops the cached promise for `key`, so the next lookup creates a fresh one. */
  evict: (key: string) => void;
};

/**
 * Creates a keyed cache that memoizes in-flight, resolved, and rejected promises, giving `use()`
 * the reference-stable promise it needs while suspended and single-flighting side-effecting
 * establishment calls across re-renders, remounts, and StrictMode double-invocation.
 *
 * Rejections are retained (not evicted) so `use()` replays them to an error boundary instead of
 * suspending forever on a fresh pending promise. Retry a failed key via {@link RetryablePromiseCache.evict}.
 */
export function createRetryablePromiseCache<T>(): RetryablePromiseCache<T> {
  const cache = new Map<string, Promise<T>>();

  return {
    get(key, create) {
      let promise = cache.get(key);
      if (!promise) {
        promise = create();

        // Mark a retained rejection handled so it isn't flagged as unhandled; `use()` still sees it.
        promise.catch(() => undefined);
        cache.set(key, promise);
      }

      return promise;
    },

    evict(key) {
      cache.delete(key);
    },
  };
}
