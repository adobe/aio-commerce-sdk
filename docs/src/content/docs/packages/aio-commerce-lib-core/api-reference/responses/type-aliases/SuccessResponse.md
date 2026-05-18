---
title: "SuccessResponse\\<TBody, THeaders\\>"
editUrl: false
prev: false
next: false
---

```ts
type SuccessResponse<TBody, THeaders> = ResponsePayload<TBody, THeaders> & {
  type: "success";
};
```

Defined in: [responses/helpers.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/a9772d73e07fa247261408a7cf3d1aa439075a5e/packages/aio-commerce-lib-core/source/responses/helpers.ts#L49)

Represents a successful response from a runtime action

## Type Declaration

### type

```ts
type: "success";
```

## Type Parameters

| Type Parameter                       | Default type    | Description              |
| ------------------------------------ | --------------- | ------------------------ |
| `TBody` _extends_ `BodyRecord`       | `BodyRecord`    | Response body properties |
| `THeaders` _extends_ `HeadersRecord` | `HeadersRecord` | Custom response headers  |
