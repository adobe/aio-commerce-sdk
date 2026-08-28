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
 * Fixed, constant prefix that every Admin UI SDK ACL resource id starts with.
 * It is owned by Commerce and is a stable part of the cross-repo id contract.
 *
 * @internal Exported for use by domain ACL helpers only — not part of the public API.
 */
// INTERNAL: The prefix and per-segment sanitization below are a cross-repo contract with the
// Commerce module's (Magento_CommerceBackendUix) ACL id generator. Both sides must produce the
// exact same id for the same input — any change here must be coordinated with the Commerce module.
export const PREFIX = "Magento_CommerceBackendUix::adminuisdk_app_";

/**
 * Sanitizes a single ACL id segment: trims whitespace, lowercases, and replaces every
 * character outside [a-z0-9_] with an underscore.
 *
 * @internal Exported for use by domain ACL helpers only — not part of the public API.
 */
export function sanitizeSegment(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
}

/**
 * Derives the deterministic Commerce ACL resource id for an app from its metadata id.
 *
 * The id is assembled as {@link PREFIX} + sanitized `metadataId`, where sanitization trims
 * whitespace, lowercases, and replaces every character outside `[a-z0-9_]` with `_`.
 * `"Magento_CommerceBackendUix::adminuisdk_app_"` is that fixed constant prefix — not a
 * placeholder — so the example below is fully reproducible from the given argument:
 *
 * @example
 * ```
 * getAclResourceId("approval-dashboard-app")
 * // PREFIX                                    + sanitize("approval-dashboard-app")
 * // "Magento_CommerceBackendUix::adminuisdk_app_" + "approval_dashboard_app"
 * // → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app"
 * ```
 *
 * @param metadataId - The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).
 * @returns The full Commerce ACL resource id, or an empty string when `metadataId` is blank.
 */
export function getAclResourceId(metadataId: string): string {
  if (metadataId.trim() === "") {
    return "";
  }
  return `${PREFIX}${sanitizeSegment(metadataId)}`;
}

/**
 * Derives the deterministic Commerce ACL resource id for a custom (standalone) ACL resource
 * declared under `adminUi.acl`. Mirrors the Commerce `AclResourceIdGenerator` `acl` token exactly.
 *
 * With only `resourceId`, returns the id of a top-level resource or a group node; with `childId`,
 * returns the id of a leaf inside that group. Each segment is sanitized independently (trim,
 * lowercase, non-`[a-z0-9_]` → `_`).
 *
 * @example
 * ```
 * getCustomAclResourceId("my-app", "approve_refunds")
 * // → "Magento_CommerceBackendUix::adminuisdk_app_my_app_acl_approve_refunds"
 * getCustomAclResourceId("my-app", "reports", "export")
 * // → "Magento_CommerceBackendUix::adminuisdk_app_my_app_acl_reports_export"
 * ```
 *
 * @param metadataId - The application's `metadata.id` value.
 * @param resourceId - The top-level resource or group `id` from `adminUi.acl`.
 * @param childId - Optional child leaf `id` when addressing a resource inside a group.
 * @returns The full Commerce ACL resource id, or an empty string when `metadataId` is blank.
 */
export function getCustomAclResourceId(
  metadataId: string,
  resourceId: string,
  childId?: string,
): string {
  const appRoot = getAclResourceId(metadataId);
  if (appRoot === "") {
    return "";
  }
  const base = `${appRoot}_acl_${sanitizeSegment(resourceId)}`;
  return childId === undefined ? base : `${base}_${sanitizeSegment(childId)}`;
}

/** Commerce entity an Admin UI component is attached to. */
export type AdminUiEntity = "order" | "product" | "customer";
