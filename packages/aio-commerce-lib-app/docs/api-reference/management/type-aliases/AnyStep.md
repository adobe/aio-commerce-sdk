# `AnyStep`

```ts
type AnyStep = {
  apply?: (plan: any, context: any) => unknown | Promise<unknown>;
  children?: AnyStep[];
  context?: (context: LifecycleContext) => any;
  install?: (config: any, context: any) => unknown | Promise<unknown>;
  isConfigured?: (config: CommerceAppConfigOutputModel) => boolean;
  meta: StepMeta;
  name: string;
  plan?: (input: any, context: any) => unknown | Promise<unknown>;
  type: "leaf" | "branch";
  uninstall?: (config: any, context: any) => void | Promise<void>;
  validate?: (
    config: any,
    context: any,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
  when?: (config: CommerceAppConfigOutputModel) => boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:198](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L198)

Loosely-typed step for use in non type-safe contexts.

## Properties

### apply?

```ts
optional apply?: (plan: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:202](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L202)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `plan`    | `any` |
| `context` | `any` |

#### Returns

`unknown` \| `Promise`\<`unknown`\>

---

### children?

```ts
optional children?: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:199](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L199)

---

### context?

```ts
optional context?: (context: LifecycleContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:203](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L203)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `context` | [`LifecycleContext`](LifecycleContext.md) |

#### Returns

`any`

---

### install?

```ts
optional install?: (config: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:204](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L204)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`unknown` \| `Promise`\<`unknown`\>

---

### isConfigured?

```ts
optional isConfigured?: (config: CommerceAppConfigOutputModel) => boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:217](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L217)

#### Parameters

| Parameter | Type                           |
| --------- | ------------------------------ |
| `config`  | `CommerceAppConfigOutputModel` |

#### Returns

`boolean`

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:205](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L205)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:206](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L206)

---

### plan?

```ts
optional plan?: (input: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:207](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L207)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `input`   | `any` |
| `context` | `any` |

#### Returns

`unknown` \| `Promise`\<`unknown`\>

---

### type

```ts
type: "leaf" | "branch";
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:208](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L208)

---

### uninstall?

```ts
optional uninstall?: (config: any, context: any) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:210](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L210)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`void` \| `Promise`\<`void`\>

---

### validate?

```ts
optional validate?: (config: any, context: any) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:212](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L212)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

\| [`ValidationIssue`](ValidationIssue.md)[]
\| `Promise`\<[`ValidationIssue`](ValidationIssue.md)[]\>

---

### when?

```ts
optional when?: (config: CommerceAppConfigOutputModel) => boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:218](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L218)

#### Parameters

| Parameter | Type                           |
| --------- | ------------------------------ |
| `config`  | `CommerceAppConfigOutputModel` |

#### Returns

`boolean`
