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

  /** Drops the cached promise for `key` only if it failed, so the next lookup retries. */
  evictIfFailed: (key: string) => void;
};

/**
 * Creates a keyed cache that memoizes in-flight, successful, and failed promises, giving `use()`
 * the reference-stable promise it needs while suspended and single-flighting side-effecting
 * establishment calls across re-renders, remounts, and StrictMode double-invocation.
 *
 * Promise rejections are failures by default. Pass `isFailure` when a fulfilled value, such as an
 * error result, must also be retryable. Failed entries remain cached until `evictIfFailed` is
 * called, so retries never replace a stable promise during render.
 *
 * @param isFailure - Determines whether a fulfilled value represents a failure.
 */
export function createRetryablePromiseCache<T>(
  isFailure: (value: T) => boolean = () => false,
): RetryablePromiseCache<T> {
  const cache = new Map<string, { promise: Promise<T>; failed: boolean }>();

  return {
    evictIfFailed(key) {
      if (cache.get(key)?.failed) {
        cache.delete(key);
      }
    },
    get(key, create) {
      const cached = cache.get(key);
      if (cached) {
        return cached.promise;
      }

      const entry = { failed: false, promise: create() };
      entry.promise
        .then((value) => {
          entry.failed = isFailure(value);
        })
        .catch(() => {
          entry.failed = true;
        });

      cache.set(key, entry);
      return entry.promise;
    },
  };
}
