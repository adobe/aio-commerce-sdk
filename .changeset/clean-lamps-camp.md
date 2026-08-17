---
"@adobe/aio-commerce-lib-app": major
"@adobe/aio-commerce-sdk": major
---

Remove the deprecated `PUT /config` action endpoint. It overwrote every value for a scope and could not express partial updates or unset a key, which caused data loss when only a subset of keys was meant to change.

**Migration:** Switch calls from `PUT /config` to `PATCH /config`. The request shape is unchanged (`{ scopeId, config: [{ name, value }] }`), but send only the entries you want to change; `PATCH` leaves unmentioned keys untouched and unsets a key when its value is `null`.
