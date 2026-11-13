# `rma-view-buttons`: Module

## Type Aliases

| Type Alias                                                           | Description                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| [RmaViewButtonErrorBody](type-aliases/RmaViewButtonErrorBody.md)     | Error body returned by a return view-button worker.         |
| [RmaViewButtonRequest](type-aliases/RmaViewButtonRequest.md)         | Parsed request body for a return view-button worker.        |
| [RmaViewButtonSuccessBody](type-aliases/RmaViewButtonSuccessBody.md) | Empty success body returned by a return view-button worker. |

## Variables

| Variable                                                              | Description                                                                                                                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RmaViewButtonRequestSchema](variables/RmaViewButtonRequestSchema.md) | Schema for a return view-button worker request. `id` identifies the clicked button; `rmaId` identifies the return being viewed. All three fields must be non-empty strings. |

## Functions

| Function                                                                    | Description                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [getRmaViewButtonAclResourceId](functions/getRmaViewButtonAclResourceId.md) | Derives the Commerce ACL resource ID for a return view button. App and button IDs are trimmed, lowercased, and sanitized independently. |
| [okRmaViewButtonResponse](functions/okRmaViewButtonResponse.md)             | Builds an HTTP 200 response with an empty body for a return view-button worker.                                                         |
| [parseRmaViewButtonRequest](functions/parseRmaViewButtonRequest.md)         | Parses a return view-button worker request. Throws `CommerceSdkValidationError` when the input is malformed.                            |
| [rmaViewButtonErrorResponse](functions/rmaViewButtonErrorResponse.md)       | Builds an error response for a return view-button worker.                                                                               |
