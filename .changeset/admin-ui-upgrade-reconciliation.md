---
"@adobe/aio-commerce-lib-app": minor
---

Add Admin UI upgrade reconciliation. The Admin UI step now diffs the installed baseline against the target configuration component-by-component, registering newly added components, removing dropped ones, and unregistering the extension when Admin UI is removed entirely. A component-less `adminUi` block is treated as absent and registers nothing, and ids within `massActions`/`viewButtons` arrays must be unique.
