# `SucceededInstallationState`

```ts
type SucceededInstallationState = InstallationStateBase & {
  completedAt: string;
  metadata?: InstallationRetryMetadata;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L104)

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
