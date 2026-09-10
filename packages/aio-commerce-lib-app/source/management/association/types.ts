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

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";

/** The Commerce instance data an app is associated with. */
export type AssociatedCommerceData = {
  /** Commerce API base URL. */
  baseUrl: string;

  /** Deployment type of the Commerce instance. */
  env: CommerceEnv;
};

/** The data of an app that we store during association. */
export type AssociationData = {
  commerce: AssociatedCommerceData;

  /**
   * Canonical Commerce instance id in the Commerce App Management Service.
   * Persisted so no-user-in-the-loop flows (e.g. auto-upgrade status writes)
   * can locate the app's record without prompting for it again. Optional
   * because apps associated before this field existed never stored it.
   */
  commerceId?: string;

  /**
   * App Builder application id in the Commerce App Management Service.
   * Persisted so no-user-in-the-loop flows (e.g. auto-upgrade status writes)
   * can locate the app's record without prompting for it again. Optional
   * because apps associated before this field existed never stored it.
   */
  extId?: string;

  /**
   * The app's record id (its table id) in the Commerce App Management Service,
   * captured when ownership is adopted. Persisted so no-user-in-the-loop flows
   * (e.g. auto-upgrade status writes) address the record directly by id, without
   * re-adopting. Optional because apps adopted before this field existed never
   * stored it; those recover it lazily by looking up their owned record.
   */
  camsExtensionId?: string;
};
