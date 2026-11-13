# `invoice-view-buttons`: Module

## Type Aliases

| Type Alias                                                                   | Description                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [InvoiceViewButtonErrorBody](type-aliases/InvoiceViewButtonErrorBody.md)     | Error body returned by an invoice view-button worker.         |
| [InvoiceViewButtonRequest](type-aliases/InvoiceViewButtonRequest.md)         | Parsed request body for an invoice view-button worker.        |
| [InvoiceViewButtonSuccessBody](type-aliases/InvoiceViewButtonSuccessBody.md) | Empty success body returned by an invoice view-button worker. |

## Variables

| Variable                                                                      | Description                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [InvoiceViewButtonRequestSchema](variables/InvoiceViewButtonRequestSchema.md) | Schema for an invoice view-button worker request. `id` identifies the clicked button; `invoiceId` identifies the invoice being viewed. All three fields must be non-empty strings. |

## Functions

| Function                                                                            | Description                                                                                                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [getInvoiceViewButtonAclResourceId](functions/getInvoiceViewButtonAclResourceId.md) | Derives the Commerce ACL resource ID for an invoice view button. App and button IDs are trimmed, lowercased, and sanitized independently. |
| [invoiceViewButtonErrorResponse](functions/invoiceViewButtonErrorResponse.md)       | Builds an error response for an invoice view-button worker.                                                                               |
| [okInvoiceViewButtonResponse](functions/okInvoiceViewButtonResponse.md)             | Builds an HTTP 200 response with an empty body for an invoice view-button worker.                                                         |
| [parseInvoiceViewButtonRequest](functions/parseInvoiceViewButtonRequest.md)         | Parses an invoice view-button worker request. Throws `CommerceSdkValidationError` when the input is malformed.                            |
