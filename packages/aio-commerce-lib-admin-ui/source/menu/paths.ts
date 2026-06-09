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

/** Menu ID for "Content" in the Adobe Commerce admin */
export const MENU_CONTENT = "content";

/** Menu ID for "Customers" in the Adobe Commerce admin */
export const MENU_CUSTOMERS = "customers";

/** Menu ID for "Marketing" in the Adobe Commerce admin */
export const MENU_MARKETING = "marketing";

/** Menu ID for "Marketing > Communications" in the Adobe Commerce admin */
export const MENU_MARKETING_COMMUNICATIONS = "marketing.communications";

/** Menu ID for "Marketing > Promotions" in the Adobe Commerce admin */
export const MENU_MARKETING_PROMOTIONS = "marketing.promotions";

/** Menu ID for "Marketing > SEO & Search" in the Adobe Commerce admin */
export const MENU_MARKETING_SEO_AND_SEARCH = "marketing.seoAndSearch";

/** Menu ID for "Reports" in the Adobe Commerce admin */
export const MENU_REPORTS = "reports";

/** Menu ID for "Reports > Customers" in the Adobe Commerce admin */
export const MENU_REPORTS_CUSTOMERS = "reports.customers";

/** Menu ID for "Reports > Marketing" in the Adobe Commerce admin */
export const MENU_REPORTS_MARKETING = "reports.marketing";

/** Menu ID for "Reports > Products" in the Adobe Commerce admin */
export const MENU_REPORTS_PRODUCTS = "reports.products";

/** Menu ID for "Reports > Sales" in the Adobe Commerce admin */
export const MENU_REPORTS_SALES = "reports.sales";

/** Menu ID for "Sales" in the Adobe Commerce admin */
export const MENU_SALES = "sales";

/** Menu ID for "Stores" in the Adobe Commerce admin */
export const MENU_STORES = "stores";

/** Menu ID for "Stores > Attributes" in the Adobe Commerce admin */
export const MENU_STORES_ATTRIBUTES = "stores.attributes";

/** Menu ID for "Stores > Currency" in the Adobe Commerce admin */
export const MENU_STORES_CURRENCY = "stores.currency";

/** Menu ID for "Stores > Inventory" in the Adobe Commerce admin */
export const MENU_STORES_INVENTORY = "stores.inventory";

/** Menu ID for "Stores > Other Settings" in the Adobe Commerce admin */
export const MENU_STORES_OTHER_SETTINGS = "stores.otherSettings";

/** Menu ID for "Stores > Settings" in the Adobe Commerce admin */
export const MENU_STORES_SETTINGS = "stores.settings";

/** Menu ID for "Stores > Taxes" in the Adobe Commerce admin */
export const MENU_STORES_TAXES = "stores.taxes";

/** Menu ID for "System" in the Adobe Commerce admin */
export const MENU_SYSTEM = "system";

/** Menu ID for "System > Other Settings" in the Adobe Commerce admin */
export const MENU_SYSTEM_OTHER_SETTINGS = "system.otherSettings";

/** All Commerce Admin menus available for app attachment. */
export const COMMERCE_MENUS = [
  // Sales
  MENU_SALES,

  // Catalog
  MENU_CATALOG,

  // Customers
  MENU_CUSTOMERS,

  // Marketing
  MENU_MARKETING,
  MENU_MARKETING_PROMOTIONS,
  MENU_MARKETING_COMMUNICATIONS,
  MENU_MARKETING_SEO_AND_SEARCH,

  // Content
  MENU_CONTENT,

  // Reports
  MENU_REPORTS,
  MENU_REPORTS_MARKETING,
  MENU_REPORTS_SALES,
  MENU_REPORTS_CUSTOMERS,
  MENU_REPORTS_PRODUCTS,

  // Stores
  MENU_STORES,
  MENU_STORES_SETTINGS,
  MENU_STORES_INVENTORY,
  MENU_STORES_TAXES,
  MENU_STORES_CURRENCY,
  MENU_STORES_ATTRIBUTES,
  MENU_STORES_OTHER_SETTINGS,

  // System
  MENU_SYSTEM,
  MENU_SYSTEM_OTHER_SETTINGS,
] as const;

/** A union type of all known supported Commerce Admin menu IDs. */
export type CommerceMenu = (typeof COMMERCE_MENUS)[number];

/** Returns true if the given string is a known Commerce Admin menu ID. */
export function isCommerceMenu(menu: string): menu is CommerceMenu {
  return (COMMERCE_MENUS as readonly string[]).includes(menu);
}
