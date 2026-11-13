# `credit-memo-view-buttons`: Module

## Type Aliases

| Type Alias                                                                         | Description                                                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [CreditMemoViewButtonErrorBody](type-aliases/CreditMemoViewButtonErrorBody.md)     | Error body returned by a credit memo view-button worker.         |
| [CreditMemoViewButtonRequest](type-aliases/CreditMemoViewButtonRequest.md)         | Parsed request body for a credit memo view-button worker.        |
| [CreditMemoViewButtonSuccessBody](type-aliases/CreditMemoViewButtonSuccessBody.md) | Empty success body returned by a credit memo view-button worker. |

## Variables

| Variable                                                                            | Description                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CreditMemoViewButtonRequestSchema](variables/CreditMemoViewButtonRequestSchema.md) | Schema for a credit memo view-button worker request. `id` identifies the clicked button; `creditMemoId` identifies the credit memo being viewed. All three fields must be non-empty strings. |

## Functions

| Function                                                                                  | Description                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [creditMemoViewButtonErrorResponse](functions/creditMemoViewButtonErrorResponse.md)       | Builds an error response for a credit memo view-button worker.                                                                               |
| [getCreditMemoViewButtonAclResourceId](functions/getCreditMemoViewButtonAclResourceId.md) | Derives the Commerce ACL resource ID for a credit memo view button. App and button IDs are trimmed, lowercased, and sanitized independently. |
| [okCreditMemoViewButtonResponse](functions/okCreditMemoViewButtonResponse.md)             | Builds an HTTP 200 response with an empty body for a credit memo view-button worker.                                                         |
| [parseCreditMemoViewButtonRequest](functions/parseCreditMemoViewButtonRequest.md)         | Parses a credit memo view-button worker request. Throws `CommerceSdkValidationError` when the input is malformed.                            |
