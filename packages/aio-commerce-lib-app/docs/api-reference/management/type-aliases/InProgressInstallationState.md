# `InProgressInstallationState`

```ts
type InProgressInstallationState = InstallationStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [management/installation/workflow/types.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L82)

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
