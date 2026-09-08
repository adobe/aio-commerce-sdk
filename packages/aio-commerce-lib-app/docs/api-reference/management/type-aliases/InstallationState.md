# `InstallationState`

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L138)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
