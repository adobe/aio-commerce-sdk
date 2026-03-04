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

export * from "./api";
export * from "./commerce";

/** Options for controlling operations of the configuration library. */
export type OperationOptions = {
  /** Optional cache timeout in milliseconds. */
  cacheTimeout?: number;
};

/** Options for controlling configuration operations. */
export type ConfigOptions = OperationOptions & {
  /** Optional encryption key for encrypting/decrypting password fields. If not provided, falls back to AIO_COMMERCE_CONFIG_ENCRYPTION_KEY environment variable. */
  encryptionKey?: string | null;
  /** Optional flag to enable config audit/versioning features. Defaults to true. */
  auditEnabled?: boolean;
};

/** Backward-compatible alias for operation and configuration options. */
export type LibConfigOptions = ConfigOptions;

/**
 * Global fetch options with all properties required.
 * @internal
 */
export type GlobalLibConfigOptions = {
  cacheTimeout: number;
  encryptionKey?: string | null;
  auditEnabled: boolean;
};
