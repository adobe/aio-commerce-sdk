# @adobe/aio-commerce-lib-admin-ui

## 1.3.0

### Minor Changes

- [#776](https://github.com/adobe/aio-commerce-sdk/pull/776) [`32988bb`](https://github.com/adobe/aio-commerce-sdk/commit/32988bbda397d9a34f788aee721f4dca9abc362a) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Add the `credit-memo-view-buttons` entrypoint with worker request/response and ACL helpers, and the `useCreditMemoViewButtonContext` hook in `./web`.

- [#802](https://github.com/adobe/aio-commerce-sdk/pull/802) [`a03c546`](https://github.com/adobe/aio-commerce-sdk/commit/a03c546f8b6a54c8c1aa1352d89b6a0efef00d9e) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Add the `rma-view-buttons` entrypoint with worker request/response and ACL helpers for return (RMA) view buttons, and the `useRmaViewButtonContext` hook in `./web`.

- [#732](https://github.com/adobe/aio-commerce-sdk/pull/732) [`f124cf4`](https://github.com/adobe/aio-commerce-sdk/commit/f124cf49208d930ca0f151e948a7597317365697) Thanks [@asalloum5](https://github.com/asalloum5)! - Add invoice view-button runtime request/response and ACL helpers, plus a React hook for invoice iframe context.

- [#746](https://github.com/adobe/aio-commerce-sdk/pull/746) [`ca065be`](https://github.com/adobe/aio-commerce-sdk/commit/ca065bec387cf90ce21309420851bef408ca194e) Thanks [@asalloum5](https://github.com/asalloum5)! - Add the `useCustomerContext` and `useStoreContext` React hooks to independently read customer and store identifiers from Commerce shared context in native UI replacement pages, with guaranteed string identifiers on success, preserved leading zeros in string IDs, and errors for missing or invalid values.

- [#770](https://github.com/adobe/aio-commerce-sdk/pull/770) [`9b6e61c`](https://github.com/adobe/aio-commerce-sdk/commit/9b6e61ceed9c45ae415c37b401272f09d4c75759) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Add support for Node.js 26.

### Patch Changes

- [#776](https://github.com/adobe/aio-commerce-sdk/pull/776) [`32988bb`](https://github.com/adobe/aio-commerce-sdk/commit/32988bbda397d9a34f788aee721f4dca9abc362a) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Fix the order, invoice and credit memo view button request parsers rejecting real Commerce requests: map the `buttonId` body field to `id` and the `X-Request-ID` header to `requestId`.
- Updated dependencies [[`9b6e61c`](https://github.com/adobe/aio-commerce-sdk/commit/9b6e61ceed9c45ae415c37b401272f09d4c75759)]:
  - @adobe/aio-commerce-lib-api@1.5.0
  - @adobe/aio-commerce-lib-core@1.4.0

## 1.2.0

### Minor Changes

- [#692](https://github.com/adobe/aio-commerce-sdk/pull/692) [`264539a`](https://github.com/adobe/aio-commerce-sdk/commit/264539a13371b11b637eb01fd1c0aa185f4349cc) Thanks [@asalloum5](https://github.com/asalloum5)! - Add `invoice`, `creditmemo`, and `shipment` grid types to the grid column wire contract, so runtime action handlers and `getGridColumnAclResourceId` can target those grids in addition to order, product, and customer. Export a `MassActionEntity` type that reflects the entities mass actions actually support (order, product, customer); `getMassActionAclResourceId` now accepts it instead of the wider grid entity type.

- [#699](https://github.com/adobe/aio-commerce-sdk/pull/699) [`53f1f8b`](https://github.com/adobe/aio-commerce-sdk/commit/53f1f8be4428862015294f1edc2816972e501a9e) Thanks [@mariam21arauj](https://github.com/mariam21arauj)! - Support the `newsletter` entity in grid-column request parsing and ACL resource id helpers, so handlers can serve Newsletter Subscriber grids.

### Patch Changes

- Updated dependencies [[`d78221e`](https://github.com/adobe/aio-commerce-sdk/commit/d78221e01894d2209b7864aca6a5fbfab93c7192), [`395eb22`](https://github.com/adobe/aio-commerce-sdk/commit/395eb22da7646944d5e5f02e1517dc23cc3ebfe6), [`9145e82`](https://github.com/adobe/aio-commerce-sdk/commit/9145e822b17b99465bfee649fae69d61c11bc0ab)]:
  - @adobe/aio-commerce-lib-api@1.4.1
  - @adobe/aio-commerce-lib-core@1.3.0

## 1.1.0

### Minor Changes

- [#626](https://github.com/adobe/aio-commerce-sdk/pull/626) [`f012ae0`](https://github.com/adobe/aio-commerce-sdk/commit/f012ae0d8eaac5cac314a62de3902fca842bd936) Thanks [@vinayrao2000](https://github.com/vinayrao2000)! - Add a `refreshExtension` client operation that re-syncs an Admin UI extension's registrations via the dedicated refresh endpoint, with its `RefreshExtensionParams` type and schema.

- [#653](https://github.com/adobe/aio-commerce-sdk/pull/653) [`c04983d`](https://github.com/adobe/aio-commerce-sdk/commit/c04983dfe04926094ab810c070598d5609004a61) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Export `sanitizeSegment`, which normalizes an id the same way Commerce does when generating ACL resource ids.

- [#653](https://github.com/adobe/aio-commerce-sdk/pull/653) [`c04983d`](https://github.com/adobe/aio-commerce-sdk/commit/c04983dfe04926094ab810c070598d5609004a61) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Add `getCustomAclResourceId` to derive the deterministic Commerce ACL resource id for a custom `adminUi.acl` resource, checkable at runtime with the permission client.

### Patch Changes

- Updated dependencies [[`1837df1`](https://github.com/adobe/aio-commerce-sdk/commit/1837df107bd2b8d2211f77438a07b6e7ee0af03e)]:
  - @adobe/aio-commerce-lib-api@1.4.0

## 1.0.1

### Patch Changes

- [#635](https://github.com/adobe/aio-commerce-sdk/pull/635) [`71bf666`](https://github.com/adobe/aio-commerce-sdk/commit/71bf66656ef1fc6dd272a0821e8b00aab5dc197e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - StrictMode is now applied only in development builds.

- Updated dependencies []:
  - @adobe/aio-commerce-lib-api@1.3.1

## 1.0.0

### Major Changes

- [#599](https://github.com/adobe/aio-commerce-sdk/pull/599) [`ac6c13b`](https://github.com/adobe/aio-commerce-sdk/commit/ac6c13b4124677820f8946c92e4cd63ab228eeae) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Release the first stable version.

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
