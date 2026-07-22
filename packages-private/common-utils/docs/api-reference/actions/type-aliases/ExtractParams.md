# `ExtractParams\<T\>`

```ts
type ExtractParams<T> = T extends `${infer Before}/*`
  ? Simplify<
      ExtractNamedParams<Before> & {
        wild: string;
      }
    >
  : ExtractNamedParams<T>;
```

Defined in: [actions/http/types.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L85)

Extracts all route parameters from a path string, including both named parameters and wildcard segments.

## Type Parameters

| Type Parameter         |
| ---------------------- |
| `T` _extends_ `string` |

## Example

```ts
// Named parameters only
type Params1 = ExtractParams<"/users/:id/posts/:postId">; // { id: string; postId: string }

// Named parameters with wildcard
type Params2 = ExtractParams<"/api/:version/*">; // { version: string; wild: string }

// Optional parameter
type Params3 = ExtractParams<"/products/:category/:id?">; // { category: string; id?: string }
```
