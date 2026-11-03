---
"@adobe/aio-commerce-lib-app": minor
---

Plans and attempt statuses now list the configuration changes of each domain in a `changes` array, which is empty when there are none. It names the items the new configuration adds, updates or removes compared with the installed one. It does not depend on the live state, so an item that is already live still appears. The step of an attempt now shows a domain whose items are already in place as succeeded.
