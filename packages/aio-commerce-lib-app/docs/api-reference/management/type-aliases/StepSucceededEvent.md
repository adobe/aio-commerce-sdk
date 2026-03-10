# `StepSucceededEvent`

```ts
type StepSucceededEvent = StepEvent & {
  result: unknown;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L40)

Event payload when a step succeeds.

## Type Declaration

### result

```ts
result: unknown;
```

Result returned by the step (only for leaf steps).
