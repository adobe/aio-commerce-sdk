# `CustomInstallationStepHandler\<TResult\>`

```ts
type CustomInstallationStepHandler<TResult> = (
  config: CommerceAppConfigOutputModel,
  context: ExecutionContext,
) => TResult | Promise<TResult>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L23)

Handler function type for custom installation steps.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `TResult`      | `unknown`    |

## Parameters

| Parameter | Type                                      | Description                                                |
| --------- | ----------------------------------------- | ---------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`            | The validated commerce app configuration                   |
| `context` | [`ExecutionContext`](ExecutionContext.md) | Execution context with logger, params, and other utilities |

## Returns

`TResult` \| `Promise`\<`TResult`\>

The result of the installation step (can be any value or Promise)
