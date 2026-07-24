# `SucceededInstallationState`

```ts
type SucceededInstallationState = InstallationStateBase & {
  completedAt: string;
  metadata?: InstallationRetryMetadata;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L104)

Installation state when completed successfully.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when installation completed.

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
status: "succeeded";
```
