# Breaking Changes

## [Unreleased]

### Deprecated

- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.
