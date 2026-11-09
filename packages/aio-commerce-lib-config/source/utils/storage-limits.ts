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

/** Error raised when a serialized history record exceeds its storage limit. */
export class StorageLimitExceededError extends Error {
  /** Serialized size of the rejected value in UTF-8 bytes. */
  public readonly valueSize: number;
  /** Maximum accepted size in bytes. */
  public readonly limit: number;

  public constructor(size: number, limit: number) {
    super(`Storage value is ${size} bytes; the limit is ${limit} bytes`);
    this.name = "StorageLimitExceededError";
    this.valueSize = size;
    this.limit = limit;
  }
}

/** Serializes JSON, rejecting values for which JSON.stringify returns no string. */
export function serializeJson(value: unknown) {
  const serialized: unknown = JSON.stringify(value);
  if (typeof serialized !== "string") {
    throw new Error("Storage value cannot be serialized to JSON");
  }
  return serialized;
}

/** Returns the UTF-8 byte length of JSON, throwing when it cannot be serialized. */
export function getValueSize(value: unknown) {
  const serialized = serializeJson(value);
  return Buffer.byteLength(serialized, "utf8");
}

/** Whether serialized JSON fits within Adobe State's 1 MiB value limit. */
export function isWithinStateSizeLimit(value: unknown) {
  return getValueSize(value) <= 1024 * 1024;
}
