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

Defined in: [actions/http/types.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/actions/http/types.ts#L84)

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
