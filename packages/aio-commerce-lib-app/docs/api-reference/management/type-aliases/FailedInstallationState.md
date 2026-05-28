# `FailedInstallationState`

```ts
type FailedInstallationState = InstallationStateBase & {
  completedAt: string;
  error: InstallationError;
  metadata?: InstallationRetryMetadata;
  startedAt: string;
  status: "failed";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L110)

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

### metadata?

```ts
optional metadata?: InstallationRetryMetadata;
```

Retry metadata, present when a retry was attempted.

### startedAt

```ts
startedAt: string;
```

ISO timestamp when installation started.

### status

```ts
status: "failed";
```
