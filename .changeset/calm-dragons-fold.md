---
"@adobe/aio-commerce-lib-app": minor
---

Reconcile configuration changes to existing Admin UI components during an upgrade. The Admin UI step now detects when a component present in both the installed and target versions has a changed configuration (ACL, labels, descriptions, notifications) and refreshes the extension to apply it, instead of leaving the change unapplied.
