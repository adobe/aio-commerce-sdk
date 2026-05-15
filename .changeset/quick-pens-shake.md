---
"@adobe/aio-commerce-lib-app": patch
---

Fix event subscriptions failing with 400 when a Commerce event provider exists with the same instance ID but a stale provider ID from a previous installation.

Add character validation to provider and event label/description fields in the eventing schema, rejecting values with characters not accepted by the Adobe I/O Events API (valid characters: letters, numbers, spaces, underscores, hyphens, dots, colons, parentheses, commas, @, and /).

Add validation for at least one field requirement in the Commerce event `fields` arrays.
