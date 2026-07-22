# `AnyStep`

```ts
type AnyStep = {
  children?: AnyStep[];
  context?: (context: InstallationContext) => any;
  install?: (config: any, context: any) => unknown | Promise<unknown>;
  meta: StepMeta;
  name: string;
  type: "leaf" | "branch";
  uninstall?: (config: any, context: any) => void | Promise<void>;
  validate?: (
    config: any,
    context: any,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
  when?: (config: CommerceAppConfigOutputModel) => boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:182](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L182)

Loosely-typed step for use in non type-safe contexts.

## Properties

### children?

```ts
optional children?: AnyStep[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:183](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L183)

---

### context?

```ts
optional context?: (context: InstallationContext) => any;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:186](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L186)

#### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `context` | [`InstallationContext`](InstallationContext.md) |

#### Returns

`any`

---

### install?

```ts
optional install?: (config: any, context: any) => unknown | Promise<unknown>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:187](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L187)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `config`  | `any` |
| `context` | `any` |

#### Returns

`unknown` \| `Promise`\<`unknown`\>

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:188](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L188)

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:189](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L189)

---

### type

```ts
type: "leaf" | "branch";
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L190)

---

### uninstall?

```ts
optional uninstall?: (config: any, context: any) => void | Promise<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:192](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L192)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:194](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L194)

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

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/step.ts:199](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/step.ts#L199)

#### Parameters

| Parameter | Type                           |
| --------- | ------------------------------ |
| `config`  | `CommerceAppConfigOutputModel` |

#### Returns

`boolean`
