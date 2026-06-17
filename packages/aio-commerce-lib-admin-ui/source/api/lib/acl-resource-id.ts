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

const PREFIX = "Magento_CommerceBackendUix::adminuisdk_app_";

/**
 * Sanitizes a single ACL id segment: trims whitespace, lowercases, and replaces every
 * character outside [a-z0-9_] with an underscore.
 *
 * This mirrors the per-segment sanitization in the Commerce module's ACL id generator.
 */
function sanitizeSegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
}

/**
 * Derives the deterministic Commerce ACL resource id for an app from its metadata id.
 *
 * This is a cross-repo contract shared with the Commerce module. Both sides must produce
 * the exact same output for the same input. Any change here must be coordinated with the
 * Commerce module's ACL id generator.
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).
 * @returns The full Commerce ACL resource id (e.g.
 *   `"Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app"`),
 *   or an empty string when `metadataId` is blank.
 */
export function getAclResourceId(metadataId: string): string {
  if (metadataId.trim() === "") {
    return "";
  }
  return `${PREFIX}${sanitizeSegment(metadataId)}`;
}

/**
 * Derives the deterministic Commerce ACL resource id for a specific menu item.
 *
 * This is a cross-repo contract shared with the Commerce module. Both sides must produce
 * the exact same output for the same input. Any change here must be coordinated with the
 * Commerce module's ACL id generator.
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).
 * @param menuId - The menu item's `id` value from `adminUi.menu.id` (e.g. `"approval_dashboard"`).
 * @returns The full Commerce ACL resource id for the menu leaf node (e.g.
 *   `"Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard"`).
 */
export function getMenuAclResourceId(
  metadataId: string,
  menuId: string,
): string {
  const appRoot = getAclResourceId(metadataId);
  if (appRoot === "") {
    return "";
  }
  return `${appRoot}_menu_${sanitizeSegment(menuId)}`;
}
