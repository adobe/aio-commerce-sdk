# `FailedInstallationState`

```ts
type FailedInstallationState = InstallationStateBase & {
  completedAt: string;
  error: InstallationError;
  startedAt: string;
  status: "failed";
};
```

Defined in: [management/installation/workflow/types.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L101)

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
