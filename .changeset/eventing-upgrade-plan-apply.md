---
"@adobe/aio-commerce-lib-app": minor
---

Add upgrade `plan`/`apply` support to the eventing domain. During an app upgrade the Commerce and external event leaves now diff the installed baseline against the target config and converge Adobe I/O Events and Commerce state: adding and removing providers, event metadata, registrations and Commerce subscriptions, and updating registrations whose event set changed.
