# `HttpActionRouter\<TContext\>`

Defined in: [actions/http/router.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L56)

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

| Type Parameter                                                     | Default type                                  |
| ------------------------------------------------------------------ | --------------------------------------------- |
| `TContext` _extends_ [`BaseContext`](../interfaces/BaseContext.md) | [`BaseContext`](../interfaces/BaseContext.md) |

## Constructors

### Constructor

```ts
new HttpActionRouter<TContext>(): HttpActionRouter<TContext>;
```

#### Returns

`HttpActionRouter`\<`TContext`\>

## Methods

### delete()

```ts
delete<TPattern, TParamsSchema, TQuerySchema>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:218](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L218)

Register a DELETE route.

#### Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TPattern` _extends_ `string`                                                       | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

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
get<TPattern, TParamsSchema, TQuerySchema>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, undefined, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L104)

Register a GET route.

#### Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TPattern` _extends_ `string`                                                       | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

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

Defined in: [actions/http/router.ts:418](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L418)

Creates an OpenWhisk/Runtime action handler from the registered routes.

#### Returns

```ts
(args: RuntimeActionParams): Promise<ActionResponse>;
```

##### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `args`    | `RuntimeActionParams` |

##### Returns

`Promise`\<`ActionResponse`\>

#### Example

```typescript
const router = new HttpActionRouter();
router.get("/hello", { handler: () => ok({ message: "Hello!" }) });

export const main = router.handler();
```

---

### patch()

```ts
patch<TPattern, TParamsSchema, TBodySchema, TQuerySchema>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:190](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L190)

Register a PATCH route.

#### Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TPattern` _extends_ `string`                                                       | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

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
post<TPattern, TParamsSchema, TBodySchema, TQuerySchema>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:132](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L132)

Register a POST route.

#### Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TPattern` _extends_ `string`                                                       | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

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
put<TPattern, TParamsSchema, TBodySchema, TQuerySchema>(path: TPattern, config: RouteConfig<TPattern, TParamsSchema, TBodySchema, TQuerySchema, TContext>): this;
```

Defined in: [actions/http/router.ts:161](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L161)

Register a PUT route.

#### Type Parameters

| Type Parameter                                                                      | Default type |
| ----------------------------------------------------------------------------------- | ------------ |
| `TPattern` _extends_ `string`                                                       | -            |
| `TParamsSchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined` | `undefined`  |
| `TBodySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`   | `undefined`  |
| `TQuerySchema` _extends_ `StandardSchemaV1`\<`unknown`, `unknown`\> \| `undefined`  | `undefined`  |

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
use<TNew>(builder: ContextBuilder<TContext, TNew>): HttpActionRouter<TContext & TNew>;
```

Defined in: [actions/http/router.ts:260](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/router.ts#L260)

Register a context builder that runs before route handlers.
Context builders can add properties to the request context.
Multiple builders are executed in order and their results are merged.

The returned router has an updated context type that includes the new properties,
enabling type-safe access in route handlers.

#### Type Parameters

| Type Parameter                                   |
| ------------------------------------------------ |
| `TNew` _extends_ `Record`\<`string`, `unknown`\> |

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
