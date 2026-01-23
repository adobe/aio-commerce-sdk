# @adobe/aio-commerce-lib-api

## 0.4.1

### Patch Changes

- [#171](https://github.com/adobe/aio-commerce-sdk/pull/171) [`9e4ad33`](https://github.com/adobe/aio-commerce-sdk/commit/9e4ad3363508e89878292ac898c81690f52ba456) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix `exports` in `package.json` for proper resolution

## 0.4.0

### Minor Changes

- [#167](https://github.com/adobe/aio-commerce-sdk/pull/167) [`2745786`](https://github.com/adobe/aio-commerce-sdk/commit/274578686e07261b68d912adfa4bae040a807c3a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - [BREAKING]: Unify all `utils` into a single entrypoint. If you were previously using `import ... from "@adobe/aio-commerce-lib-config/utils/<something>"` now you need to import just from `utils`, effectively removing the `<something>` subpath.

## 0.3.2

### Patch Changes

- Updated dependencies [[`3c88b74`](https://github.com/adobe/aio-commerce-sdk/commit/3c88b74ccfea0df06514b696ce8797c95e1acc4f)]:
  - @adobe/aio-commerce-lib-auth@0.6.2

## 0.3.1

### Patch Changes

- Updated dependencies [[`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac), [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac), [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac)]:
  - @adobe/aio-commerce-lib-core@0.5.1
  - @adobe/aio-commerce-lib-auth@0.6.1

## 0.3.0

### Minor Changes

- [#118](https://github.com/adobe/aio-commerce-sdk/pull/118) [`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Support IMS Authentication when using PaaS Commerce flavor in `AdobeCommerceHttpClient`

- [#118](https://github.com/adobe/aio-commerce-sdk/pull/118) [`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add a new `resolveCommerceHttpClientParams` utility that is able to resolve the configuration of an `AdobeCommerceHttpClient` from the params of a runtime action

### Patch Changes

- Updated dependencies [[`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e), [`fd6a1b5`](https://github.com/adobe/aio-commerce-sdk/commit/fd6a1b531aaea399fea875c8e1e03002790cb1f4), [`493da95`](https://github.com/adobe/aio-commerce-sdk/commit/493da9595c06de304ecddbbc8295db124cb6fcba)]:
  - @adobe/aio-commerce-lib-core@0.5.0
  - @adobe/aio-commerce-lib-auth@0.6.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277)]:
  - @adobe/aio-commerce-lib-auth@0.5.0

## 0.2.0

### Minor Changes

- [#97](https://github.com/adobe/aio-commerce-sdk/pull/97) [`4c2e0c4`](https://github.com/adobe/aio-commerce-sdk/commit/4c2e0c4699d64065853e648f5bba5b66acda08c3) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Initial release of `@adobe/aio-commerce-lib-api`

## 0.1.1

### Patch Changes

- Updated dependencies [[`e0db24c`](https://github.com/adobe/aio-commerce-sdk/commit/e0db24c04aed9a6df72e80d5395aa41374570b6a)]:
  - @adobe/aio-commerce-lib-auth@0.4.0

## 0.1.0

### Minor Changes

- [#69](https://github.com/adobe/aio-commerce-sdk/pull/69) [`7dbe39e`](https://github.com/adobe/aio-commerce-sdk/commit/7dbe39eabc01159724db12a6f854c18970ab1e79) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Create library and introduce HTTP clients for Adobe Commerce and for Adobe I/O events.

- [#72](https://github.com/adobe/aio-commerce-sdk/pull/72) [`31eb4e4`](https://github.com/adobe/aio-commerce-sdk/commit/31eb4e403f30b593aafff57dc268bf9e6cf49f3e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Introduce transformation hooks and utils. Ensure config is required on HTTP client creation.
