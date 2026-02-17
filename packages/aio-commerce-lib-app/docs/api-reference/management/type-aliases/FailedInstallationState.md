# `FailedInstallationState`

```ts
type FailedInstallationState = InstallationStateBase & {
  completedAt: string;
  error: InstallationError;
  startedAt: string;
  status: "failed";
};
```

Defined in: [management/installation/workflow/types.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L101)

Installation state when failed.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when installation failed.

### error

```ts
error: InstallationError;
```

Error information about the failure.

### startedAt

```ts
startedAt: string;
```

ISO timestamp when installation started.

### status

```ts
status: "failed";
```
