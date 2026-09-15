# `defineRoute()`

```ts
function defineRoute<
  TContext extends BaseContext,
  TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined =
    undefined,
  TBodySchema extends StandardSchemaV1<unknown, unknown> | undefined =
    undefined,
  TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined =
    undefined,
>(
  _router: HttpActionRouter<TContext>,
  config: RouteConfig<
    string,
    TParamsSchema,
    TBodySchema,
    TQuerySchema,
    TContext
  >,
): RouteConfig<string, TParamsSchema, TBodySchema, TQuerySchema, TContext>;
```

Defined in: [actions/http/router.ts:476](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/common-utils/source/actions/http/router.ts#L476)

Define a route handler separately from registration.
Pass a router to infer context type from middleware.

## Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TContext` _extends_ [`BaseContext`](../type-aliases/BaseContext.md)                | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

## Parameters

| Parameter | Type                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `_router` | [`HttpActionRouter`](../classes/HttpActionRouter.md)\<`TContext`\>                                                      |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`string`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\> |

## Returns

[`RouteConfig`](../type-aliases/RouteConfig.md)\<`string`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\>
