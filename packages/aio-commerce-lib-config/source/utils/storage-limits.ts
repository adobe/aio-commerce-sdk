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

/**
 * Adobe I/O State library storage limits.
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */

/**
 * Byte conversion constants
 */
const BYTES_PER_KB = 1024;
const KB_PER_MB = 1024;

/**
 * Maximum state value size: 1MB
 */
export const MAX_STATE_VALUE_SIZE = BYTES_PER_KB * KB_PER_MB; // 1MB in bytes

/**
 * Maximum state key size: 1024 bytes
 */
export const MAX_STATE_KEY_SIZE = 1024;

/**
 * Default TTL for persistent data: -1 (never expire)
 */
export const PERSISTENT_TTL = -1;

/**
 * Checks if a value exceeds Adobe I/O State size limits.
 *
 * @param value - Value to check (will be JSON stringified).
 * @returns True if value is within limits.
 */
export function isWithinStateSizeLimit(value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    const sizeInBytes = Buffer.byteLength(serialized, "utf8");
    return sizeInBytes <= MAX_STATE_VALUE_SIZE;
  } catch {
    return false;
  }
}

/**
 * Gets the size of a value in bytes when serialized.
 *
 * @param value - Value to measure.
 * @returns Size in bytes, or -1 if cannot be serialized.
 */
export function getValueSize(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    return Buffer.byteLength(serialized, "utf8");
  } catch {
    return -1;
  }
}

/**
 * Pattern for valid state keys
 * Alphanumeric characters, dash, underscore, and period are allowed
 */
const VALID_KEY_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Validates a state key against Adobe I/O State requirements.
 *
 * @param key - Key to validate.
 * @returns True if key is valid.
 */
export function isValidStateKey(key: string): boolean {
  if (key.length > MAX_STATE_KEY_SIZE) {
    return false;
  }

  return VALID_KEY_PATTERN.test(key);
}

/**
 * Error thrown when a value exceeds storage limits.
 */
export class StorageLimitExceededError extends Error {
  public readonly valueSize: number;
  public readonly limit: number;

  public constructor(valueSize: number, limit: number) {
    super(
      `Storage limit exceeded: value size ${valueSize} bytes exceeds limit of ${limit} bytes`,
    );
    this.name = "StorageLimitExceededError";
    this.valueSize = valueSize;
    this.limit = limit;
  }
}
