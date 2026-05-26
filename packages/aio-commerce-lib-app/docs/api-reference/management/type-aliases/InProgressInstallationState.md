# `InProgressInstallationState`

```ts
type InProgressInstallationState = InstallationStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L82)

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
