# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: InstallationError;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: InstallationError;
```

Error information.
