# `RouteConfig\<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext\>`

```ts
type RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext> =
  {
    body?: TBodySchema;
    handler: (
      req: RouteRequest<
        TParamsSchema extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<TParamsSchema>
          : Simplify<ExtractParams<TPattern>>,
        TBodySchema extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<TBodySchema>
          : unknown,
        TQuerySchema extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<TQuerySchema>
          : Record<string, string>
      >,
      ctx: TContext,
    ) => Promisable<ActionResponse>;
    params?: TParamsSchema extends StandardSchemaV1
      ? ValidParamsSchema<TPattern, TParamsSchema>
      : undefined;
    query?: TQuerySchema;
  };
```

Defined in: [actions/http/types.ts:184](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L184)

Route configuration with type inference from schemas and context.
If schemas are provided, they're used for both validation AND type inference.
Otherwise, types are inferred from the path pattern.

## Type Parameters

| Type Parameter                                                     | Default type                                  | Description                                |
| ------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------ |
| `TPattern` _extends_ `string`                                      | `string`                                      | The route path pattern string              |
| `TParamsSchema` _extends_ `StandardSchemaV1` \| `undefined`        | `undefined`                                   | Optional schema for route parameters       |
| `TBodySchema` _extends_ `StandardSchemaV1` \| `undefined`          | `undefined`                                   | Optional schema for request body           |
| `TQuerySchema` _extends_ `StandardSchemaV1` \| `undefined`         | `undefined`                                   | Optional schema for query parameters       |
| `TContext` _extends_ [`BaseContext`](../interfaces/BaseContext.md) | [`BaseContext`](../interfaces/BaseContext.md) | The context type (defaults to BaseContext) |

## Properties

### body?

```ts
optional body: TBodySchema;
```

Defined in: [actions/http/types.ts:200](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L200)

Optional schema for validating and typing request body

---

### handler()

```ts
handler: (
  req: RouteRequest<
    TParamsSchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TParamsSchema>
      : Simplify<ExtractParams<TPattern>>,
    TBodySchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TBodySchema>
      : unknown,
    TQuerySchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TQuerySchema>
      : Record<string, string>
  >,
  ctx: TContext,
) => Promisable<ActionResponse>;
```

Defined in: [actions/http/types.ts:206](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L206)

Route handler with properly typed request and context

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`     | [`RouteRequest`](../interfaces/RouteRequest.md)\<`TParamsSchema` _extends_ `StandardSchemaV1` ? `StandardSchemaV1.InferOutput`\<`TParamsSchema`\> : `Simplify`\<[`ExtractParams`](ExtractParams.md)\<`TPattern`\>\>, `TBodySchema` _extends_ `StandardSchemaV1` ? `StandardSchemaV1.InferOutput`\<`TBodySchema`\> : `unknown`, `TQuerySchema` _extends_ `StandardSchemaV1` ? `StandardSchemaV1.InferOutput`\<`TQuerySchema`\> : `Record`\<`string`, `string`\>\> |
| `ctx`     | `TContext`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### Returns

`Promisable`\<`ActionResponse`\>

---

### params?

```ts
optional params: TParamsSchema extends StandardSchemaV1 ? ValidParamsSchema<TPattern, TParamsSchema> : undefined;
```

Defined in: [actions/http/types.ts:195](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L195)

Optional schema for validating and typing route parameters.
If provided, must include all parameters from the path pattern.

---

### query?

```ts
optional query: TQuerySchema;
```

Defined in: [actions/http/types.ts:203](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L203)

Optional schema for validating and typing query parameters
