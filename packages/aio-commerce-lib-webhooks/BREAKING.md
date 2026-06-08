# Breaking Changes

> All unreleased changes are planned for the next major release together with other accumulated breaking changes.

## [Unreleased]

### Breaking Changes (planned)

#### ky v2

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6336 -->

The SDK uses [ky](https://github.com/sindresorhus/ky) as its HTTP client. ky v2 introduces several breaking changes. See the [ky v2 release notes](https://github.com/sindresorhus/ky/releases/tag/v2.0.0) for the full migration guide. The following affect this package's public API surface:

- **Hook signatures:** all hooks now receive a single state object instead of separate positional arguments. Any `hooks` key passed via `fetchOptions` to an endpoint function will need to be updated.
- **`beforeError` hook:** now receives all errors, not just `HTTPError`. Implementations must add a type guard before accessing `HTTPError`-specific properties.
- **`HTTPError` response body:** `await error.response.json()` is replaced by `error.data`, which is pre-parsed. Any `catch` block that reads the error response body must be updated.

The `fetchOptions` parameter of the following endpoint functions accepts a `hooks` key:

- `getWebhookList`
- `subscribeWebhook`
- `unsubscribeWebhook`
- `getSupportedWebhookList`
