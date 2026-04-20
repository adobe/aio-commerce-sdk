# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: InstallationError;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: InstallationError;
```

Error information.
