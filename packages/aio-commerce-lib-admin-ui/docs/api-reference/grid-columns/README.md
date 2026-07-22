# `grid-columns`: Module

## Type Aliases

| Type Alias                                         | Description                                                    |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [GridErrorBody](type-aliases/GridErrorBody.md)     | Failure body returned to Commerce.                             |
| [GridRequest](type-aliases/GridRequest.md)         | Parsed request body sent by Commerce to a grid column handler. |
| [GridRow](type-aliases/GridRow.md)                 | Cell values returned for a single row, keyed by `id`.          |
| [GridSuccessBody](type-aliases/GridSuccessBody.md) | Success body returned to Commerce.                             |
| [GridType](type-aliases/GridType.md)               | Grid identifier sent on the wire.                              |

## Variables

| Variable                                            | Description                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| [GridRequestSchema](variables/GridRequestSchema.md) | Schema for the JSON body Commerce POSTs to a grid column handler.              |
| [GridTypeSchema](variables/GridTypeSchema.md)       | Grid identifier sent by Commerce on the `commerce/backend-ui/2` wire contract. |

## Functions

| Function                                                              | Description                                                                                                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [errorGridResponse](functions/errorGridResponse.md)                   | Builds an error response for a grid column handler with the given HTTP status code.                                                       |
| [getGridColumnAclResourceId](functions/getGridColumnAclResourceId.md) | Derives the deterministic Commerce ACL resource id for a grid column.                                                                     |
| [okGridResponse](functions/okGridResponse.md)                         | Builds an HTTP 200 success response carrying the grid column data envelope Commerce expects on the `commerce/backend-ui/2` wire contract. |
| [parseGridRequest](functions/parseGridRequest.md)                     | Parses and validates the JSON body Commerce POSTs to a grid column handler.                                                               |

## References

### AdminUiEntity

Re-exports [AdminUiEntity](../api/type-aliases/AdminUiEntity.md)
