---
"@adobe/aio-commerce-lib-app": patch
---

Fix auto-upgrade leaving event subscriptions orphaned when a prior upgrade attempt fails partway through. A failed upgrade's baseline now reflects what it actually created, so the next upgrade correctly removes anything no longer in the config.
