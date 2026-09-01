# `InProgressInstallationState`

```ts
type InProgressInstallationState = InstallationStateBase & {
  startedAt: string;
  status: "in-progress";
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L90)

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
