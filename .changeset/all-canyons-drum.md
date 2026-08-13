---
"@adobe/aio-commerce-lib-app": minor
---

Add upgrade planning support for webhook configuration updates: the webhooks step now detects field-level configuration changes (fields, conditions, headers, and other settings) between the installed and target versions for webhooks whose identity is unchanged, and updates only the affected properties without recreating or removing the webhook.
