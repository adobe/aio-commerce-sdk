# `okOrderViewButtonResponse()`

```ts
function okOrderViewButtonResponse(): SuccessResponse<OrderViewButtonSuccessBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts:66](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts#L66)

Builds an HTTP 200 success response for an order view button handler.

Commerce renders `notifications.success` from the registration as the
toast body when present, and a default success toast otherwise.

## Returns

`SuccessResponse`\<[`OrderViewButtonSuccessBody`](../type-aliases/OrderViewButtonSuccessBody.md)\>

## Example

```ts
return okOrderViewButtonResponse();
```
