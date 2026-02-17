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

Defined in: [actions/http/types.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages-private/common-utils/source/actions/http/types.ts#L84)

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
