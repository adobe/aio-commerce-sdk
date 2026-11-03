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

Defined in: [actions/http/router.ts:472](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/actions/http/router.ts#L472)

Define a route handler separately from registration.
Pass a router to infer context type from middleware.

## Type Parameters

| Type Parameter                                                                                                                | Default type |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tcontext"></a> `TContext` _extends_ [`BaseContext`](../type-aliases/BaseContext.md)                     | -            |
| <a id="type-parameter-tparamsschema"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tbodyschema"></a> `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`     | `undefined`  |
| <a id="type-parameter-tqueryschema"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

## Parameters

| Parameter | Type                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `_router` | [`HttpActionRouter`](../classes/HttpActionRouter.md)\<`TContext`\>                                                      |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`string`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\> |

## Returns

[`RouteConfig`](../type-aliases/RouteConfig.md)\<`string`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\>
