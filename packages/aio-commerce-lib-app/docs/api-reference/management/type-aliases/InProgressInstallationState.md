# `InProgressInstallationState`

```ts
type InProgressInstallationState = InstallationStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L82)

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
