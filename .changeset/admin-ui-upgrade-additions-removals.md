---
"@adobe/aio-commerce-lib-app": minor
---

Add upgrade planning support for Admin UI component additions and removals: the Admin UI step now diffs the installed baseline against the target configuration component-by-component, registering newly added components and removing dropped ones, and unregistering the extension when Admin UI is removed entirely.
