# `InstallationState`

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L138)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
