# Breaking Changes

> [!IMPORTANT]
> All unreleased changes are planned for the next major release, except for those that remained experimental.

## [Unreleased]

### Breaking Changes (planned)

- The fallback in `resolveImsAuthParams` for manually wired `AIO_COMMERCE_AUTH_IMS_*` OAuth Server-to-Server credentials and the `sync-ims-credentials` CLI command will be removed. **Replacement:** annotate actions with `include-ims-credentials: true` and call `resolveImsAuthParams(params)` to consume the injected credentials. This does not affect forwarding an existing token with `AIO_COMMERCE_AUTH_IMS_TOKEN` / `AIO_COMMERCE_AUTH_IMS_API_KEY`, or Commerce Integration credentials.

### Deprecated

- Manually wiring `AIO_COMMERCE_AUTH_IMS_*` OAuth Server-to-Server credentials is deprecated in favor of the `include-ims-credentials: true` action annotation. The fallback remains temporarily for compatibility and is planned for removal in the next major release.
- The `sync-ims-credentials` CLI command is deprecated and will be removed in the next major release. Use the `include-ims-credentials: true` action annotation instead.
