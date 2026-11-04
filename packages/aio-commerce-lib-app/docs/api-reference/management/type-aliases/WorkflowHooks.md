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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L52)

Lifecycle hooks for workflow execution.

## Properties

### onFailure?

```ts
onFailure?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L55)

---

### onStart?

```ts
onStart?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L53)

---

### onStepFailure?

```ts
onStepFailure?: HookFunction<StepFailedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L59)

---

### onStepStart?

```ts
onStepStart?: HookFunction<StepStartedEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L57)

---

### onStepSuccess?

```ts
onStepSuccess?: HookFunction<StepSucceededEvent>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L58)

---

### onSuccess?

```ts
onSuccess?: WorkflowHook;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/hooks.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/hooks.ts#L54)
