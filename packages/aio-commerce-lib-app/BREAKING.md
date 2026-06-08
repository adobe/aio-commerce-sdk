# Breaking Changes

> [!IMPORTANT]
> All unreleased changes are planned for the next major release.

## [Unreleased]

### Deprecated

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6337 -->

- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.
