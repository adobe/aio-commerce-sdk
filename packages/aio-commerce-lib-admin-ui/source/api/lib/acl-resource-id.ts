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
 * Derives the deterministic Commerce ACL resource id for an app from its metadata id.
 *
 * This is a cross-repo contract shared with
 * `Magento\CommerceBackendUix\Model\Acl\AclResourceIdGenerator` in
 * `magento/module-commerce-backend-uix`. Both sides must produce the exact same output
 * for the same input. Any change here must be coordinated with that PHP class.
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"acme-promotions"`).
 * @returns The full Commerce ACL resource id (e.g.
 *   `"Magento_CommerceBackendUix::adminuisdk_app_acme_promotions"`),
 *   or an empty string when `metadataId` is blank.
 */
export function getAclResourceId(metadataId: string): string {
  const trimmed = metadataId.trim();
  if (trimmed === "") {
    return "";
  }
  // Note: both hyphens and underscores normalize to "_", so "acme-app" and "acme_app"
  // produce the same id. The App Registry is expected to enforce uniqueness upstream.
  const sanitized = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return `Magento_CommerceBackendUix::adminuisdk_app_${sanitized}`;
}
