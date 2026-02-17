# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: InstallationError;
};
```

Defined in: [management/installation/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: InstallationError;
```

Error information.
