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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:202](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L202)

Loosely-typed step for use in non type-safe contexts.

## Properties

### apply?

```ts
apply?: (plan: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:206](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L206)

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
children?: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:203](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L203)

---

### context?

```ts
context?: (context: LifecycleContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:207](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L207)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `context` | [`LifecycleContext`](LifecycleContext.md) |

#### Returns

`any`

---

### install?

```ts
install?: (config: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:208](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L208)

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
isConfigured?: (config: CommerceAppConfigOutputModel) => boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:221](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L221)

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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:209](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L209)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:210](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L210)

---

### plan?

```ts
plan?: (input: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:211](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L211)

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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:212](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L212)

---

### uninstall?

```ts
uninstall?: (config: any, context: any) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:214](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L214)

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
validate?: (config: any, context: any) =>
  | ValidationIssue[]
| Promise<ValidationIssue[]>;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:216](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L216)

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
when?: (config: CommerceAppConfigOutputModel) => boolean;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/step.ts:222](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/common/workflow/step.ts#L222)

#### Parameters

| Parameter | Type                           |
| --------- | ------------------------------ |
| `config`  | `CommerceAppConfigOutputModel` |

#### Returns

`boolean`
