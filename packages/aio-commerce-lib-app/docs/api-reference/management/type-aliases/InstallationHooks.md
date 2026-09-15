# `InstallationHooks`

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

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L43)

Lifecycle hooks for an installation or uninstallation run.

## Properties

### onInstallationFailure?

```ts
optional onInstallationFailure?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L46)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### onInstallationStart?

```ts
optional onInstallationStart?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L44)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### onInstallationSuccess?

```ts
optional onInstallationSuccess?: (state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L45)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### onStepFailure?

```ts
optional onStepFailure?: (event: StepFailedEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L56)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `event`   | [`StepFailedEvent`](StepFailedEvent.md)   |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### onStepStart?

```ts
optional onStepStart?: (event: StepStartedEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L48)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `event`   | [`StepStartedEvent`](StepStartedEvent.md) |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md) |

#### Returns

`void` \| `Promise`\<`void`\>

---

### onStepSuccess?

```ts
optional onStepSuccess?: (event: StepSucceededEvent, state: WorkflowRunState) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L52)

#### Parameters

| Parameter | Type                                          |
| --------- | --------------------------------------------- |
| `event`   | [`StepSucceededEvent`](StepSucceededEvent.md) |
| `state`   | [`WorkflowRunState`](WorkflowRunState.md)     |

#### Returns

`void` \| `Promise`\<`void`\>
