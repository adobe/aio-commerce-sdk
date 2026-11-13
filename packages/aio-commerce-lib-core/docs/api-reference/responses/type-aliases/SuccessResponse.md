# `SuccessResponse\<TBody *extends* `BodyRecord`=`BodyRecord`, THeaders *extends* `HeadersRecord`=`HeadersRecord`\>`

```ts
type SuccessResponse<
  TBody extends BodyRecord = BodyRecord,
  THeaders extends HeadersRecord = HeadersRecord,
> = ResponsePayload<TBody, THeaders> & {
  type: "success";
};
```

Defined in: [responses/helpers.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-core/source/responses/helpers.ts#L49)

Represents a successful response from a runtime action

## Type Parameters

| Type Parameter                                                            | Default type    | Description              |
| ------------------------------------------------------------------------- | --------------- | ------------------------ |
| <a id="type-parameter-tbody"></a> `TBody` _extends_ `BodyRecord`          | `BodyRecord`    | Response body properties |
| <a id="type-parameter-theaders"></a> `THeaders` _extends_ `HeadersRecord` | `HeadersRecord` | Custom response headers  |

## Type Declaration

### type

```ts
type: "success";
```
