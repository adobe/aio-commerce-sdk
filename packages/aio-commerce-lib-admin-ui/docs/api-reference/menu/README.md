# `menu`: Module

## Type Aliases

| Type Alias                                   | Description                                                  |
| -------------------------------------------- | ------------------------------------------------------------ |
| [CommerceMenu](type-aliases/CommerceMenu.md) | A union type of all known supported Commerce Admin menu IDs. |

## Variables

| Variable                                      | Description                                            |
| --------------------------------------------- | ------------------------------------------------------ |
| [COMMERCE_MENUS](variables/COMMERCE_MENUS.md) | All Commerce Admin menus available for app attachment. |
| [MENU_CATALOG](variables/MENU_CATALOG.md)     | Menu ID for "Catalog" in the Adobe Commerce admin      |
| [MENU_CONTENT](variables/MENU_CONTENT.md)     | Menu ID for "Content" in the Adobe Commerce admin      |
| [MENU_CUSTOMERS](variables/MENU_CUSTOMERS.md) | Menu ID for "Customers" in the Adobe Commerce admin    |
| [MENU_MARKETING](variables/MENU_MARKETING.md) | Menu ID for "Marketing" in the Adobe Commerce admin    |
| [MENU_REPORTS](variables/MENU_REPORTS.md)     | Menu ID for "Reports" in the Adobe Commerce admin      |
| [MENU_SALES](variables/MENU_SALES.md)         | Menu ID for "Sales" in the Adobe Commerce admin        |
| [MENU_STORES](variables/MENU_STORES.md)       | Menu ID for "Stores" in the Adobe Commerce admin       |
| [MENU_SYSTEM](variables/MENU_SYSTEM.md)       | Menu ID for "System" in the Adobe Commerce admin       |

## Functions

| Function                                                  | Description                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [getMenuAclResourceId](functions/getMenuAclResourceId.md) | Derives the deterministic Commerce ACL resource id for a specific menu item. |
| [isCommerceMenu](functions/isCommerceMenu.md)             | Returns true if the given string is a known Commerce Admin menu ID.          |
