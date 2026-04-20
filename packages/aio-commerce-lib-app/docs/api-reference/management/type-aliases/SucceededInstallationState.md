# `SucceededInstallationState`

```ts
type SucceededInstallationState = InstallationStateBase & {
  completedAt: string;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L90)

Installation state when completed successfully.

## Type Declaration

### completedAt

```ts
completedAt: string;
```

ISO timestamp when installation completed.

### startedAt

```ts
startedAt: string;
```

ISO timestamp when installation started.

### status

```ts
status: "succeeded";
```
