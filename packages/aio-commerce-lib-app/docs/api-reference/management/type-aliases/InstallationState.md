# `InstallationState`

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [management/installation/workflow/types.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L118)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
