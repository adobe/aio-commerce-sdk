---
title: "InProgressInstallationState"
editUrl: false
prev: false
next: false
---

```ts
type InProgressInstallationState = InstallationStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L82)

Installation state when in progress.

## Type Declaration

### startedAt

```ts
startedAt: string;
```

ISO timestamp when installation started.

### status

```ts
status: "in-progress";
```
