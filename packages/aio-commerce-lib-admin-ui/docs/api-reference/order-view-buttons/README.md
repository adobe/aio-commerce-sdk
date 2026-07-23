# `order-view-buttons`: Module

## Type Aliases

| Type Alias                                                               | Description                                                                      |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [OrderViewButtonErrorBody](type-aliases/OrderViewButtonErrorBody.md)     | Failure body returned to Commerce when a worker order view button handler fails. |
| [OrderViewButtonRequest](type-aliases/OrderViewButtonRequest.md)         | Parsed request body sent by Commerce to an order view button handler.            |
| [OrderViewButtonSuccessBody](type-aliases/OrderViewButtonSuccessBody.md) | Success body returned to Commerce — an empty object signals success.             |

## Variables

| Variable                                                                  | Description                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [OrderViewButtonRequestSchema](variables/OrderViewButtonRequestSchema.md) | Schema for the JSON body Commerce POSTs to an order view button handler. |

## Functions

| Function                                                                        | Description                                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [getOrderViewButtonAclResourceId](functions/getOrderViewButtonAclResourceId.md) | Derives the deterministic Commerce ACL resource id for an order view button.                     |
| [okOrderViewButtonResponse](functions/okOrderViewButtonResponse.md)             | Builds an HTTP 200 success response for an order view button handler.                            |
| [orderViewButtonErrorResponse](functions/orderViewButtonErrorResponse.md)       | Builds an error response for a worker order view button handler with the given HTTP status code. |
| [parseOrderViewButtonRequest](functions/parseOrderViewButtonRequest.md)         | Parses and validates the JSON body Commerce POSTs to an order view button handler.               |
