# `WorkflowHooks`

```ts
type WorkflowHooks = {
  onFailure?: WorkflowHook;
  onStart?: WorkflowHook;
  onStepFailure?: HookFunction<StepFailedEvent>;
  onStepStart?: HookFunction<StepStartedEvent>;
  onStepSuccess?: HookFunction<StepSucceededEvent>;
  onSuccess?: WorkflowHook;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L52)

Lifecycle hooks for workflow execution.

## Properties

### onFailure?

```ts
optional onFailure?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L55)

---

### onStart?

```ts
optional onStart?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L53)

---

### onStepFailure?

```ts
optional onStepFailure?: HookFunction<StepFailedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L59)

---

### onStepStart?

```ts
optional onStepStart?: HookFunction<StepStartedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L57)

---

### onStepSuccess?

```ts
optional onStepSuccess?: HookFunction<StepSucceededEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L58)

---

### onSuccess?

```ts
optional onSuccess?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L54)
