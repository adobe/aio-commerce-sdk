# `StepSucceededEvent`

```ts
type StepSucceededEvent = StepEvent & {
  result: unknown;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L40)

Event payload when a step succeeds.

## Type Declaration

### result

```ts
result: unknown;
```

Result returned by the step (only for leaf steps).
