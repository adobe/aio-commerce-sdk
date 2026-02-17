# `StepFailedEvent`

```ts
type StepFailedEvent = StepEvent & {
  error: InstallationError;
};
```

Defined in: [management/installation/workflow/hooks.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L46)

Event payload when a step fails.

## Type Declaration

### error

```ts
error: InstallationError;
```

Error information.
