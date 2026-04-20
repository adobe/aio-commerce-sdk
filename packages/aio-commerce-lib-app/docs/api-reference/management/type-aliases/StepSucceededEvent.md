# `StepSucceededEvent`

```ts
type StepSucceededEvent = StepEvent & {
  result: unknown;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L40)

Event payload when a step succeeds.

## Type Declaration

### result

```ts
result: unknown;
```

Result returned by the step (only for leaf steps).
