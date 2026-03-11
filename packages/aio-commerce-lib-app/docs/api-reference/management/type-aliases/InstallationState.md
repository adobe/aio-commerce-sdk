# `InstallationState`

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L118)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
