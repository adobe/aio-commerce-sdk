---
"@adobe/aio-commerce-plugin-app-migration": patch
"@adobe/aio-commerce-plugin-app-management": minor
---

Keep `COMMERCE_WEBHOOKS_PUBLIC_KEY` and the README signature setup steps after migration when any webhook sets `requireAdobeAuth: false`. The `commerce-app-webhooks` skill now guides you to set `timeout`, `soft_timeout`, `required`, `fallback_error_message`, `requireAdobeAuth` and `category` on each webhook.
