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
 * Creates a keyed cache of promises that memoizes in-flight and resolved promises and evicts
 * failed ones, so a later lookup for the same key retries instead of replaying the rejection.
 *
 * This is the reference-stable memoization that `use()` requires while suspended, and the
 * single-flight guarantee that side-effecting establishment calls (which have no teardown to
 * undo a duplicate) need to survive re-renders, remounts, and StrictMode double-invocation.
 *
 * @returns A `get-or-create` function: it returns the cached promise for `key`, or runs
 * `create` to produce and cache one on a miss.
 */
export function createRetryablePromiseCache<T>() {
  const cache = new Map<string, Promise<T>>();

  return (key: string, create: () => Promise<T>): Promise<T> => {
    let promise = cache.get(key);
    if (!promise) {
      promise = create();
      promise.catch(() => {
        if (cache.get(key) === promise) {
          cache.delete(key);
        }
      });

      cache.set(key, promise);
    }

    return promise;
  };
}
