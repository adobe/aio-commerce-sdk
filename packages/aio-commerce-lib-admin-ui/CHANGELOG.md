# @adobe/aio-commerce-lib-admin-ui

## 0.2.0

### Minor Changes

- [#528](https://github.com/adobe/aio-commerce-sdk/pull/528) [`0bb7d15`](https://github.com/adobe/aio-commerce-sdk/commit/0bb7d150961f631116b1ac421124960b5b857896) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Add `getGridColumnAclResourceId`, `getMassActionAclResourceId`, and `getOrderViewButtonAclResourceId` helpers to derive the Commerce ACL resource id for protected grid columns, mass actions, and order view buttons, mirroring `getMenuAclResourceId`.

- [#522](https://github.com/adobe/aio-commerce-sdk/pull/522) [`4396a64`](https://github.com/adobe/aio-commerce-sdk/commit/4396a647ad22dba063cdf03a16e04aef9387212f) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Add `getAdminUiPermissionClient` for checking ACL permissions at runtime (SPA bootstrap and runtime action entry). Includes in-process TTL cache, in-flight request deduplication, and deny-by-default on errors. Also exports `getAclResourceId` for deterministic ACL resource id derivation from `metadata.id`.

- [#542](https://github.com/adobe/aio-commerce-sdk/pull/542) [`c15b50f`](https://github.com/adobe/aio-commerce-sdk/commit/c15b50f667e6d1288270dbd4192c150db0ff0914) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add browser helpers for Admin UI iframe extensions.

- [#508](https://github.com/adobe/aio-commerce-sdk/pull/508) [`c36f825`](https://github.com/adobe/aio-commerce-sdk/commit/c36f825aff7329fc2831d8aaca032d17bbee373a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add `@adobe/aio-commerce-lib-admin-ui/menu` entrypoint with named constants for Commerce Admin menu IDs (`MENU_SALES`, `MENU_CATALOG`, etc.), a `COMMERCE_MENUS` collection, a `CommerceMenu` type, and an `isCommerceMenu` type guard.

- [#516](https://github.com/adobe/aio-commerce-sdk/pull/516) [`bdcced9`](https://github.com/adobe/aio-commerce-sdk/commit/bdcced9297ae5e1b87ce86490a2b6fad76b2e341) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Add `order-view-buttons` entrypoint with request parsing and response builders for `commerce/backend-ui/2` order view button handlers.

- [#551](https://github.com/adobe/aio-commerce-sdk/pull/551) [`a66f389`](https://github.com/adobe/aio-commerce-sdk/commit/a66f3892622584d27cd6b5d2fc633e15bf9942a8) Thanks [@asalloum5](https://github.com/asalloum5)! - Add `enableAdminUiSdk` to the Admin UI API client, which enables the Admin UI SDK in Commerce via `PUT /V1/adminuisdk/config`.

- [#486](https://github.com/adobe/aio-commerce-sdk/pull/486) [`413da36`](https://github.com/adobe/aio-commerce-sdk/commit/413da36dcd83e5a41c194f5af50611097659e725) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Add request and response builders for the `commerce/backend-ui/2` grid column wire contract.

- [#546](https://github.com/adobe/aio-commerce-sdk/pull/546) [`ca2c4fe`](https://github.com/adobe/aio-commerce-sdk/commit/ca2c4febcdfbe52b933775f08e9a53765fc306ab) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Remove `extensionUrl` from extension registration params. The Commerce backend now derives the view URL from the App Registry, so the field has no effect for v2 installed apps.

- [#492](https://github.com/adobe/aio-commerce-sdk/pull/492) [`ce63b2b`](https://github.com/adobe/aio-commerce-sdk/commit/ce63b2b46f7ef1f2f68780b13e52d1c13fd5fe6e) Thanks [@jcuerdo](https://github.com/jcuerdo)! - Add `mass-actions` entrypoint with wire contract helpers for `commerce/backend-ui/2` mass actions. Parse worker action requests with `parseMassActionRequest`, and build success/error responses with `okMassActionResponse`/`errorMassActionResponse`.

### Patch Changes

- Updated dependencies [[`19400fb`](https://github.com/adobe/aio-commerce-sdk/commit/19400fbdfc03c5bbfc30f995a2acdd4272c5e032), [`ce7768e`](https://github.com/adobe/aio-commerce-sdk/commit/ce7768e0ddc6ca35ad6ccec60f584c8bb5a743f0), [`4396a64`](https://github.com/adobe/aio-commerce-sdk/commit/4396a647ad22dba063cdf03a16e04aef9387212f), [`e85bec4`](https://github.com/adobe/aio-commerce-sdk/commit/e85bec40f1eaa91dd6bb7bc6954b2ecfc3ea4029), [`413da36`](https://github.com/adobe/aio-commerce-sdk/commit/413da36dcd83e5a41c194f5af50611097659e725)]:
  - @adobe/aio-commerce-lib-core@1.2.0
  - @adobe/aio-commerce-lib-api@1.3.0

## 0.1.0

### Minor Changes

- [#489](https://github.com/adobe/aio-commerce-sdk/pull/489) [`d227e47`](https://github.com/adobe/aio-commerce-sdk/commit/d227e475ec0b513ca06e4e7950497b2a20ee4674) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Add `@adobe/aio-commerce-lib-admin-ui` library for interacting with the Adobe Commerce Admin UI SDK API, including extension registration and unregistration.
