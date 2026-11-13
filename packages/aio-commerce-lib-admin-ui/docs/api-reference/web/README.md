# `web`: Module

## Type Aliases

| Type Alias                                                                 | Description                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [CreateExtensionAppOptions](type-aliases/CreateExtensionAppOptions.md)     | Configuration options when instantiating an extension app.                            |
| [CreditMemoViewButtonContext](type-aliases/CreditMemoViewButtonContext.md) | The context shared with credit memo view-button extension points.                     |
| [CustomerContext](type-aliases/CustomerContext.md)                         | The customer identifier provided by the Commerce shared context.                      |
| [ExtensionRoute](type-aliases/ExtensionRoute.md)                           | Defines a route that exists at a given path.                                          |
| [HostConnection](type-aliases/HostConnection.md)                           | Actions for closing the extension iframe and returning control to the Commerce Admin. |
| [ImsContext](type-aliases/ImsContext.md)                                   | The IMS credentials provided by the host (Commerce Admin or Experience Cloud shell).  |
| [InvoiceViewButtonContext](type-aliases/InvoiceViewButtonContext.md)       | The context shared with invoice view-button extension points.                         |
| [MassActionContext](type-aliases/MassActionContext.md)                     | The context shared with mass-action extension points.                                 |
| [OrderViewButtonContext](type-aliases/OrderViewButtonContext.md)           | The context shared with order view-button extension points.                           |
| [RmaViewButtonContext](type-aliases/RmaViewButtonContext.md)               | The context shared with return (RMA) view-button extension points.                    |
| [SharedContext](type-aliases/SharedContext.md)                             | The Commerce shared context for a mounted Admin UI iframe app.                        |
| [StoreContext](type-aliases/StoreContext.md)                               | The store identifier provided by the Commerce shared context.                         |

## Functions

| Function                                                                      | Description                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [createExtensionApp](functions/createExtensionApp.md)                         | Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX registration, shared-context attachment, routing, and Spectrum setup.                                                                   |
| [useCommerce](functions/useCommerce.md)                                       | Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over the guest connection.                                                                                                 |
| [useCreditMemoViewButtonContext](functions/useCreditMemoViewButtonContext.md) | Returns the credit memo ID for a credit memo view-button extension point. Reads `creditMemoId` from the page URL search parameters or hash-route query. Returns an error when the credit memo ID is missing or blank. |
| [useCustomerContext](functions/useCustomerContext.md)                         | Returns the customer identifier from the Commerce shared context as a string. Numeric identifiers are converted to strings; existing strings retain leading zeros.                                                    |
| [useHostConnection](functions/useHostConnection.md)                           | Returns typed helpers for interacting with the Commerce Admin host.                                                                                                                                                   |
| [useIms](functions/useIms.md)                                                 | Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the Experience Cloud shell.                                                                                                     |
| [useInvoiceViewButtonContext](functions/useInvoiceViewButtonContext.md)       | Returns the invoice ID for an invoice view-button extension point. Reads `invoiceId` from the page URL search parameters or hash-route query. Returns an error when the invoice ID is missing or blank.               |
| [useMassActionContext](functions/useMassActionContext.md)                     | Returns the context for a mass-action extension point: the selected row IDs the action was triggered with. The value is read from the host-provided Commerce context.                                                 |
| [useOrderViewButtonContext](functions/useOrderViewButtonContext.md)           | Returns the context for an order view-button extension point: the order ID the button was triggered from.                                                                                                             |
| [useRmaViewButtonContext](functions/useRmaViewButtonContext.md)               | Returns the return (RMA) ID for a return view-button extension point. Reads `rmaId` from the page URL search parameters or hash-route query. Returns an error when the return ID is missing or blank.                 |
| [useSharedContext](functions/useSharedContext.md)                             | Returns the current Commerce shared context. The guest connection is already established by the time this can be called (see SharedContextProvider).                                                                  |
| [useStoreContext](functions/useStoreContext.md)                               | Returns the store identifier from the Commerce shared context as a string. Numeric identifiers are converted to strings; existing strings retain leading zeros.                                                       |
