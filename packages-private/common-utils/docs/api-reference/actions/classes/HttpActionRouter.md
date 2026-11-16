# `HttpActionRouter\<TContext *extends* [`BaseContext`](../type-aliases/BaseContext.md) = [`BaseContext`](../type-aliases/BaseContext.md)\>`

Defined in: [actions/http/router.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L67)

HTTP router for Adobe I/O Runtime actions.
Provides type-safe routing with schema validation and OpenWhisk integration.

## Example

```typescript
const router = new HttpActionRouter();

router.get("/users/:id", {
  handler: (req) => ok({ id: req.params.id, context: req.context }),
});

// Add context builders
router.use(async (base) => ({
  user: await getUser(base.rawParams.__ow_headers?.authorization),
}));

export const main = router.handler();
```

## Type Parameters

| Type Parameter                                                                                            | Default type                                    |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| <a id="type-parameter-tcontext"></a> `TContext` _extends_ [`BaseContext`](../type-aliases/BaseContext.md) | [`BaseContext`](../type-aliases/BaseContext.md) |

## Constructors

### Constructor

```ts
new HttpActionRouter<TContext extends BaseContext = BaseContext>(options?: HttpActionRouterOptions): HttpActionRouter<TContext>;
```

Defined in: [actions/http/router.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L80)

#### Parameters

| Parameter  | Type                                                                    | Description     |
| ---------- | ----------------------------------------------------------------------- | --------------- |
| `options?` | [`HttpActionRouterOptions`](../type-aliases/HttpActionRouterOptions.md) | Router options. |

#### Returns

`HttpActionRouter`\<`TContext`\>

#### Example

```typescript
const router = new HttpActionRouter({
  headers: { "x-content-type-options": "nosniff" },
});
```

## Methods

### delete()

```ts
delete<TPattern extends string, TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:267](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L267)

Register a DELETE route.

#### Type Parameters

| Type Parameter                                                                                                                | Default type |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tpattern"></a> `TPattern` _extends_ `string`                                                            | -            |
| <a id="type-parameter-tparamsschema"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tqueryschema"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

#### Parameters

| Parameter | Type                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `path`    | `TPattern`                                                                                                              |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`TPattern`, `TParamsSchema`, `undefined`, `TQuerySchema`, `TContext`\> |

#### Returns

`this`

#### Example

```typescript
router.delete("/users/:id", {
  handler: (req) => noContent(),
});
```

---

### get()

```ts
get<TPattern extends string, TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:153](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L153)

Register a GET route.

#### Type Parameters

| Type Parameter                                                                                                                  | Default type |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tpattern-1"></a> `TPattern` _extends_ `string`                                                            | -            |
| <a id="type-parameter-tparamsschema-1"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tqueryschema-1"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

#### Parameters

| Parameter | Type                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `path`    | `TPattern`                                                                                                              |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`TPattern`, `TParamsSchema`, `undefined`, `TQuerySchema`, `TContext`\> |

#### Returns

`this`

#### Example

```typescript
router.get("/users/:id", {
  handler: (req) => ok({ id: req.params.id }),
});
```

---

### handler()

```ts
handler(): (args: RuntimeActionParams) => Promise<ActionResponse>;
```

Defined in: [actions/http/router.ts:468](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L468)

Creates an OpenWhisk/Runtime action handler from the registered routes.

#### Returns

(`args`: `RuntimeActionParams`) => `Promise`\<`ActionResponse`\>

#### Example

```typescript
const router = new HttpActionRouter();
router.get("/hello", { handler: () => ok({ message: "Hello!" }) });

export const main = router.handler();
```

---

### patch()

```ts
patch<TPattern extends string, TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TBodySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:239](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L239)

Register a PATCH route.

#### Type Parameters

| Type Parameter                                                                                                                  | Default type |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tpattern-2"></a> `TPattern` _extends_ `string`                                                            | -            |
| <a id="type-parameter-tparamsschema-2"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tbodyschema"></a> `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`       | `undefined`  |
| <a id="type-parameter-tqueryschema-2"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

#### Parameters

| Parameter | Type                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `path`    | `TPattern`                                                                                                                |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`TPattern`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\> |

#### Returns

`this`

#### Example

```typescript
router.patch("/users/:id", {
  body: partialUserSchema,
  handler: (req) => ok(req.body),
});
```

---

### post()

```ts
post<TPattern extends string, TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TBodySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:181](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L181)

Register a POST route.

#### Type Parameters

| Type Parameter                                                                                                                  | Default type |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tpattern-3"></a> `TPattern` _extends_ `string`                                                            | -            |
| <a id="type-parameter-tparamsschema-3"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tbodyschema-1"></a> `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`     | `undefined`  |
| <a id="type-parameter-tqueryschema-3"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

#### Parameters

| Parameter | Type                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `path`    | `TPattern`                                                                                                                |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`TPattern`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\> |

#### Returns

`this`

#### Example

```typescript
router.post("/users", {
  body: userSchema,
  handler: (req) => created(req.body),
});
```

---

### put()

```ts
put<TPattern extends string, TParamsSchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TBodySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined, TQuerySchema extends StandardSchemaV1<unknown, unknown> | undefined = undefined>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:210](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L210)

Register a PUT route.

#### Type Parameters

| Type Parameter                                                                                                                  | Default type |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-tpattern-4"></a> `TPattern` _extends_ `string`                                                            | -            |
| <a id="type-parameter-tparamsschema-4"></a> `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| <a id="type-parameter-tbodyschema-2"></a> `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`     | `undefined`  |
| <a id="type-parameter-tqueryschema-4"></a> `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |

#### Parameters

| Parameter | Type                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `path`    | `TPattern`                                                                                                                |
| `config`  | [`RouteConfig`](../type-aliases/RouteConfig.md)\<`TPattern`, `TParamsSchema`, `TBodySchema`, `TQuerySchema`, `TContext`\> |

#### Returns

`this`

#### Example

```typescript
router.put("/users/:id", {
  body: userSchema,
  handler: (req) => ok(req.body),
});
```

---

### use()

```ts
use<TNew extends Record<string, unknown>>(builder: ContextBuilder<TContext, TNew>): HttpActionRouter<TContext & TNew>;
```

Defined in: [actions/http/router.ts:309](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L309)

Register a context builder that runs before route handlers.
Context builders can add properties to the request context.
Multiple builders are executed in order and their results are merged.

The returned router has an updated context type that includes the new properties,
enabling type-safe access in route handlers.

#### Type Parameters

| Type Parameter                                                                    |
| --------------------------------------------------------------------------------- |
| <a id="type-parameter-tnew"></a> `TNew` _extends_ `Record`\<`string`, `unknown`\> |

#### Parameters

| Parameter | Type                                                                        | Description                                                        |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `builder` | [`ContextBuilder`](../type-aliases/ContextBuilder.md)\<`TContext`, `TNew`\> | Function that receives base context and returns additional context |

#### Returns

`HttpActionRouter`\<`TContext` & `TNew`\>

The router instance with updated context type for chaining

#### Example

```typescript
const router = new HttpActionRouter()
  .use(logger()) // HttpActionRouter<BaseContext & { logger: Logger }>
  .use(auth()); // HttpActionRouter<BaseContext & { logger: Logger } & { user: User }>

router.get("/me", {
  handler: (req, ctx) => {
    ctx.logger.info("Hello"); // ✅ typed
    return ok({ body: ctx.user }); // ✅ typed
  },
});
```
