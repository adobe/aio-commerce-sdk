# Breaking Changes

> [!IMPORTANT]
> All unreleased changes are planned for the next major release.

## [Unreleased]

### Breaking Changes

- `adminUiSdk` config key and `commerce/backend-ui/1` extension point support removed. The generated registration action (`src/commerce-backend-ui-1/.generated/actions/registration/index.js`) and its `pre-app-build` hook are no longer produced. **Replacement:** use `adminUi` and `commerce/backend-ui/2` — see the updated `usage.md`.
- `buildAdminUiSdkExtConfig()` removed from the public API.
- Types removed from the public API: `AdminUiSdkConfiguration`, `AdminUiSdkGridColumns`, `AdminUiSdkRegistration`, `AppConfigWithAdminUiSdk`, `BannerNotification`, `CustomerMassAction`, `CustomFee`, `MenuItem`, `OrderMassAction`, `OrderViewButton`, `ProductMassAction`.
- `hasAdminUiSdk()` removed from the public API.
- `GET /registration` endpoint removed from the app-config runtime action.

### Deprecated

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6337 -->

- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.
