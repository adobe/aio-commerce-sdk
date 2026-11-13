# `okOrderViewButtonResponse()`

```ts
function okOrderViewButtonResponse(): SuccessResponse<OrderViewButtonSuccessBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts#L67)

Builds an HTTP 200 success response for an order view button handler.

Commerce renders `notifications.success` from the registration as the
toast body when present, and a default success toast otherwise.

## Returns

`SuccessResponse`\<[`OrderViewButtonSuccessBody`](../type-aliases/OrderViewButtonSuccessBody.md)\>

## Example

```ts
return okOrderViewButtonResponse();
```
