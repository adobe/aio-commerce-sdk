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

/** Menu ID for "Catalog" in the Adobe Commerce admin */
export const MENU_CATALOG = "catalog";

/** Menu ID for "Customers" in the Adobe Commerce admin */
export const MENU_CUSTOMERS = "customers";

/** Menu ID for "Marketing" in the Adobe Commerce admin */
export const MENU_MARKETING = "marketing";

/** Menu ID for "Content" in the Adobe Commerce admin */
export const MENU_CONTENT = "content";

/** Menu ID for "Reports" in the Adobe Commerce admin */
export const MENU_REPORTS = "reports";

/** Menu ID for "Sales" in the Adobe Commerce admin */
export const MENU_SALES = "sales";

/** Menu ID for "Stores" in the Adobe Commerce admin */
export const MENU_STORES = "stores";

/** Menu ID for "System" in the Adobe Commerce admin */
export const MENU_SYSTEM = "system";

/** All Commerce Admin menus available for app attachment. */
export const COMMERCE_MENUS = [
  MENU_SALES,
  MENU_CATALOG,
  MENU_CUSTOMERS,
  MENU_MARKETING,
  MENU_CONTENT,
  MENU_REPORTS,
  MENU_STORES,
  MENU_SYSTEM,
] as const;

/** A union type of all known supported Commerce Admin menu IDs. */
export type CommerceMenu = (typeof COMMERCE_MENUS)[number];

/** Returns true if the given string is a known Commerce Admin menu ID. */
export function isCommerceMenu(menu: string): menu is CommerceMenu {
  return (COMMERCE_MENUS as readonly string[]).includes(menu);
}
