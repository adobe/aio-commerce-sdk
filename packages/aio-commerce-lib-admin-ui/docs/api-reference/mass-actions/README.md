# `mass-actions`: Module

## Type Aliases

| Type Alias                                                       | Description                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [MassActionErrorBody](type-aliases/MassActionErrorBody.md)       | Error body returned to Commerce when a worker mass action fails.         |
| [MassActionGridType](type-aliases/MassActionGridType.md)         | Grid identifier sent on the wire by a worker mass action request.        |
| [MassActionRequest](type-aliases/MassActionRequest.md)           | Parsed request body sent by Commerce to a worker mass action handler.    |
| [MassActionResponseBody](type-aliases/MassActionResponseBody.md) | Response body returned to Commerce after a worker mass action completes. |

## Variables

| Variable                                                          | Description                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [MassActionGridTypeSchema](variables/MassActionGridTypeSchema.md) | Grid identifier sent by Commerce on the `commerce/backend-ui/2` wire contract for worker mass actions. |
| [MassActionRequestSchema](variables/MassActionRequestSchema.md)   | Schema for the JSON body Commerce POSTs to a worker mass action handler.                               |

## Functions

| Function                                                              | Description                                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [getMassActionAclResourceId](functions/getMassActionAclResourceId.md) | Derives the deterministic Commerce ACL resource id for a mass action.              |
| [massActionErrorResponse](functions/massActionErrorResponse.md)       | Builds an error response for a worker mass action with the given HTTP status code. |
| [okMassActionResponse](functions/okMassActionResponse.md)             | Builds an HTTP 200 success response for a worker mass action.                      |
| [parseMassActionRequest](functions/parseMassActionRequest.md)         | Parses and validates the JSON body Commerce POSTs to a worker mass action handler. |

## References

### AdminUiEntity

Re-exports [AdminUiEntity](../api/type-aliases/AdminUiEntity.md)
