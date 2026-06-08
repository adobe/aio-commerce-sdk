# Changelog

## [Unreleased]

### Deprecated

#### `@adobe/aio-commerce-lib-app`

- `generateInstanceIdDeprecated()` will be removed in a future major — use `generateInstanceId()` instead. The old function could produce non-unique IDs within the same org.
- `getLegacyRegistrationName()` will be removed in a future major — use `getRegistrationName()` instead. The legacy format omits the provider label from the registration name and is only kept to match registrations created before the naming change.
- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.

### Breaking Changes (planned)

#### ky v2 hook signature change (`@adobe/aio-commerce-lib-api`)

The SDK uses [ky](https://github.com/sindresorhus/ky) as its HTTP client. ky v2 changed hook signatures from positional arguments to a single state object:

```ts
// ky v1 (current SDK public API)
beforeRequest: [(request, options, retryCount) => { ... }]

// ky v2
beforeRequest: [({ request, options, retryCount }) => { ... }]
```

The same change applies to `afterResponse`, `beforeError`, and `beforeRetry`.

It will be part of the next major release together with other accumulated breaking changes.

**What users will need to update:** any call site passing `hooks` to an SDK HTTP client — destructure the state argument instead of receiving each value as a separate parameter.
