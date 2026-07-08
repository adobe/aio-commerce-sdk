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

/** A single provider entry stored in system config after installation. */
export type StoredProviderEntry = {
  /** The I/O Events provider UUID. */
  id: string;
  /** Maps each event's declared `name` to its fully-qualified event code. */
  events: Record<string, string>;
};

/**
 * Shape of the `system.events` entry written to system storage at installation time.
 * Keyed by `provider.key` (or slugified label when `key` is absent).
 */
export type StoredEventsData = {
  providers: Record<string, StoredProviderEntry>;
};

/** Storage key used for the events installation data. */
export const EVENTS_STORAGE_KEY = "events";
