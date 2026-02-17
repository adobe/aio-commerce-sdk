# `SucceededInstallationState`

```ts
type SucceededInstallationState = InstallationStateBase & {
  completedAt: string;
  startedAt: string;
  status: "succeeded";
};
```

Defined in: [management/installation/workflow/types.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L90)

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
