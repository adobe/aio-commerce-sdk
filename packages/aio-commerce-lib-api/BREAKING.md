# Breaking Changes

## [Unreleased]

### Breaking Changes (planned)

#### ky v2 hook signature change

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
