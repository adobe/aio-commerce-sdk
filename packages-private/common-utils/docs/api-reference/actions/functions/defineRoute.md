# `defineRoute()`

```ts
function defineRoute<TContext, TParamsSchema, TBodySchema, TQuerySchema>(
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

Defined in: [actions/http/router.ts:473](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L473)

Define a route handler separately from registration.
Pass a router to infer context type from middleware.

## Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TContext` _extends_ [`BaseContext`](../interfaces/BaseContext.md)                  | -            |
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
