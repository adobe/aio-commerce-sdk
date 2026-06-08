# Breaking Changes

## [Unreleased]

### Deprecated

- `generateInstanceIdDeprecated()` will be removed in a future major — use `generateInstanceId()` instead. The old function could produce non-unique IDs within the same org.
- `getLegacyRegistrationName()` will be removed in a future major — use `getRegistrationName()` instead. The legacy format omits the provider label from the registration name and is only kept to match registrations created before the naming change.
- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.
