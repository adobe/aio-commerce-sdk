# ~~`InstallationHooks`~~

```ts
type InstallationHooks = {
  onInstallationFailure?: (state: WorkflowRunState) => void | Promise<void>;
  onInstallationStart?: (state: WorkflowRunState) => void | Promise<void>;
  onInstallationSuccess?: (state: WorkflowRunState) => void | Promise<void>;
  onStepFailure?: (
    event: StepFailedEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
  onStepStart?: (
    event: StepStartedEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
  onStepSuccess?: (
    event: StepSucceededEvent,
    state: WorkflowRunState,
  ) => void | Promise<void>;
};
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L45)

Lifecycle hooks for an installation or uninstallation run.

## Deprecated

Removed in the next major together with [runInstallation](../functions/runInstallation.md).

## Properties

### ~~onInstallationFailure?~~

```ts
onInstallationFailure?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L48)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### ~~onInstallationStart?~~

```ts
onInstallationStart?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L46)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### ~~onInstallationSuccess?~~

```ts
onInstallationSuccess?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L47)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### ~~onStepFailure?~~

```ts
onStepFailure?: (event: StepFailedEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L58)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `event`   | [`StepFailedEvent`](StepFailedEvent.md)   |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### ~~onStepStart?~~

```ts
onStepStart?: (event: StepStartedEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L50)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `event`   | [`StepStartedEvent`](StepStartedEvent.md) |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### ~~onStepSuccess?~~

```ts
onStepSuccess?: (event: StepSucceededEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/deprecated/runner.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/deprecated/runner.ts#L54)

#### Parameters

| Parameter | Type                                          |
| --------- | --------------------------------------------- |
| `event`   | [`StepSucceededEvent`](StepSucceededEvent.md) |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md)     |

#### Returns

`void` \| `Promise`\<`void`\>
