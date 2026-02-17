# `StepSucceededEvent`

```ts
type StepSucceededEvent = StepEvent & {
  result: unknown;
};
```

Defined in: [management/installation/workflow/hooks.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L40)

Event payload when a step succeeds.

## Type Declaration

### result

```ts
result: unknown;
```

Result returned by the step (only for leaf steps).
