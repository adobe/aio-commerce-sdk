---
"@adobe/aio-commerce-lib-app": patch
---

Recover safely when Commerce rejects a webhook or event-subscription replacement or addition during an upgrade. An identity change is applied as a remove-then-add; if the target accepts the removal but rejects the replacement, the previous entity is now restored and the upgrade fails reporting the original rejection, instead of leaving the target out of sync with the stored baseline. Adding several new event subscriptions in one upgrade is no longer partial either: if the target rejects one, the ones already created in that attempt are rolled back too. When recovery itself cannot restore the baseline, the failure records both errors and flags that the target may no longer match the baseline. Fresh installs keep their existing best-effort behavior.
