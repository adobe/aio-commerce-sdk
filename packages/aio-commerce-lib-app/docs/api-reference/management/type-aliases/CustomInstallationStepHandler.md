# `CustomInstallationStepHandler\<TResult = `unknown`\>`

```ts
type CustomInstallationStepHandler<TResult = unknown> = (
  config: CommerceAppConfigOutputModel,
  context: ExecutionContext,
) => TResult | Promise<TResult>;
```

Defined in: [aio-commerce-lib-app/source/management/domains/custom-installation/define.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/domains/custom-installation/define.ts#L23)

Handler function type for custom installation steps.

## Type Parameters

| Type Parameter                                | Default type |
| --------------------------------------------- | ------------ |
| <a id="type-parameter-tresult"></a> `TResult` | `unknown`    |

## Parameters

| Parameter | Type                                      | Description                                                |
| --------- | ----------------------------------------- | ---------------------------------------------------------- |
| `config`  | `CommerceAppConfigOutputModel`            | The validated commerce app configuration                   |
| `context` | [`ExecutionContext`](ExecutionContext.md) | Execution context with logger, params, and other utilities |

## Returns

`TResult` \| `Promise`\<`TResult`\>

The result of the installation step (can be any value or Promise)
