# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: InstallationError;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: InstallationError;
```

Error information.
