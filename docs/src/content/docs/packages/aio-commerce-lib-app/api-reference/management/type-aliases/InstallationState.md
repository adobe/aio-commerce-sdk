---
title: "InstallationState"
editUrl: false
prev: false
next: false
---

```ts
type InstallationState =
  | InProgressInstallationState
  | SucceededInstallationState
  | FailedInstallationState;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L118)

The full installation state (persisted and returned by status endpoints).
Discriminated union by `status` field.
