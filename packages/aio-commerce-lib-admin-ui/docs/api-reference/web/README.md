# `web`: Module

## Type Aliases

| Type Alias                                                             | Description                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [CreateExtensionAppOptions](type-aliases/CreateExtensionAppOptions.md) | Configuration options when instantiating an extension app.                            |
| [ExtensionRoute](type-aliases/ExtensionRoute.md)                       | Defines a route that exists at a given path.                                          |
| [HostConnection](type-aliases/HostConnection.md)                       | Actions for closing the extension iframe and returning control to the Commerce Admin. |
| [ImsContext](type-aliases/ImsContext.md)                               | The IMS credentials provided by the host (Commerce Admin or Experience Cloud shell).  |
| [MassActionContext](type-aliases/MassActionContext.md)                 | The context shared with mass-action extension points.                                 |
| [OrderViewButtonContext](type-aliases/OrderViewButtonContext.md)       | The context shared with order view-button extension points.                           |
| [SharedContext](type-aliases/SharedContext.md)                         | The Commerce shared context for a mounted Admin UI iframe app.                        |

## Functions

| Function                                                            | Description                                                                                                                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [createExtensionApp](functions/createExtensionApp.md)               | Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX registration, shared-context attachment, routing, and Spectrum setup.                   |
| [useCommerce](functions/useCommerce.md)                             | Returns the host (domain) of the Commerce Admin the extension is embedded in, resolving it over the guest connection.                                                 |
| [useHostConnection](functions/useHostConnection.md)                 | Returns typed helpers for interacting with the Commerce Admin host.                                                                                                   |
| [useIms](functions/useIms.md)                                       | Returns the IMS credentials provided by the host. Works inside the Commerce Admin and the Experience Cloud shell.                                                     |
| [useMassActionContext](functions/useMassActionContext.md)           | Returns the context for a mass-action extension point: the selected row IDs the action was triggered with. The value is read from the host-provided Commerce context. |
| [useOrderViewButtonContext](functions/useOrderViewButtonContext.md) | Returns the context for an order view-button extension point: the order ID the button was triggered from.                                                             |
| [useSharedContext](functions/useSharedContext.md)                   | Returns the current Commerce shared context. The guest connection is already established by the time this can be called (see SharedContextProvider).                  |
