---
title: "ActionResponse\\<TSuccessBody, TErrorBody, THeaders\\>"
editUrl: false
prev: false
next: false
---

```ts
type ActionResponse<TSuccessBody, TErrorBody, THeaders> =
  | SuccessResponse<TSuccessBody, THeaders>
  | ErrorResponse<TErrorBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/a9772d73e07fa247261408a7cf3d1aa439075a5e/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                                 | Default type            | Description             |
| ---------------------------------------------- | ----------------------- | ----------------------- |
| `TSuccessBody` _extends_ `BodyRecord`          | `BodyRecord`            | -                       |
| `TErrorBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | -                       |
| `THeaders` _extends_ `HeadersRecord`           | `HeadersRecord`         | Custom response headers |

## Template

Response/error body properties
