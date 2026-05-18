# `InstallationState`

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:130](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L130)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
