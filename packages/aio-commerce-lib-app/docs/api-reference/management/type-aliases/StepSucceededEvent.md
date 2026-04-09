# `StepSucceededEvent`

```ts
type StepSucceededEvent = StepEvent & {
  result: unknown;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L40)

Event payload when a step succeeds.

## Type Declaration

### result

```ts
result: unknown;
```

Result returned by the step (only for leaf steps).
