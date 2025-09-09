# `io-events`: Module

## Type Aliases

| Type Alias                                                                                             | Description                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [CreateEventMetadataForProviderParams](type-aliases/CreateEventMetadataForProviderParams.md)           | The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.      |
| [EventProviderCreateParams](type-aliases/EventProviderCreateParams.md)                                 | The schema of the parameters received by the POST `providers` Adobe I/O Events API endpoint.                        |
| [EventProviderGetByIdParams](type-aliases/EventProviderGetByIdParams.md)                               | The schema of the parameters received by the GET `providers/:id` Adobe I/O Events API endpoint.                     |
| [EventProviderListAllParams](type-aliases/EventProviderListAllParams.md)                               | Defines the parameters received by the GET `providers` Adobe I/O Events API endpoint.                               |
| [GetAllEventMetadataForProviderParams](type-aliases/GetAllEventMetadataForProviderParams.md)           | The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.       |
| [GetEventMetadataForEventAndProviderParams](type-aliases/GetEventMetadataForEventAndProviderParams.md) | The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint. |
| [IoEventMetadata](type-aliases/IoEventMetadata.md)                                                     | Defines the base fields of an event metadata entity.                                                                |
| [IoEventMetadataManyResponse](type-aliases/IoEventMetadataManyResponse.md)                             | Defines the fields of many event metadata entities returned by the Adobe I/O Events API.                            |
| [IoEventMetadataOneResponse](type-aliases/IoEventMetadataOneResponse.md)                               | Defines the fields of an event metadata entity returned by the Adobe I/O Events API.                                |
| [IoEventProvider](type-aliases/IoEventProvider.md)                                                     | Defines the base fields of an I/O event provider entity.                                                            |
| [IoEventProviderManyResponse](type-aliases/IoEventProviderManyResponse.md)                             | Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.                        |
| [IoEventProviderOneResponse](type-aliases/IoEventProviderOneResponse.md)                               | Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API.                            |

## Variables

| Variable                                                                                            | Description                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [CreateEventMetadataForProviderSchema](variables/CreateEventMetadataForProviderSchema.md)           | The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.      |
| [EventProviderCreateParamsSchema](variables/EventProviderCreateParamsSchema.md)                     | -                                                                                                                   |
| [EventProviderGetByIdParamsSchema](variables/EventProviderGetByIdParamsSchema.md)                   | -                                                                                                                   |
| [EventProviderListAllParamsSchema](variables/EventProviderListAllParamsSchema.md)                   | -                                                                                                                   |
| [GetAllEventMetadataForProviderSchema](variables/GetAllEventMetadataForProviderSchema.md)           | The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.       |
| [GetEventMetadataForEventAndProviderSchema](variables/GetEventMetadataForEventAndProviderSchema.md) | The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint. |

## Functions

| Function                                                                                | Description                                                                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [create3rdPartyCustomEventProvider](functions/create3rdPartyCustomEventProvider.md)     | Creates a 3rd Party Custom Events (of type `3rd_party_custom_events`) event provider.                                         |
| [createAdobeIoEventsApiClient](functions/createAdobeIoEventsApiClient.md)               | Creates a new API client for the Adobe I/O Events API client.                                                                 |
| [createCommerceEventProvider](functions/createCommerceEventProvider.md)                 | Creates a Commerce (of type `dx_commerce_events`) event provider.                                                             |
| [createCustomAdobeIoEventsApiClient](functions/createCustomAdobeIoEventsApiClient.md)   | Creates a customized Adobe I/O Events API client.                                                                             |
| [createEventMetadataForProvider](functions/createEventMetadataForProvider.md)           | Creates event metadata for a provider.                                                                                        |
| [createEventProvider](functions/createEventProvider.md)                                 | Creates an event provider.                                                                                                    |
| [getAll3rdPartyCustomEventProviders](functions/getAll3rdPartyCustomEventProviders.md)   | Lists all 3rd Party Custom Events (of type `3rd_party_custom_events`) event providers for the given consumer organization ID. |
| [getAllCommerceEventProviders](functions/getAllCommerceEventProviders.md)               | Lists all Commerce (of type `dx_commerce_events`) event providers for the given consumer organization ID.                     |
| [getAllEventMetadataForProvider](functions/getAllEventMetadataForProvider.md)           | Gets all event metadata for a specific provider.                                                                              |
| [getAllEventProviders](functions/getAllEventProviders.md)                               | Lists all event providers for the given consumer organization ID.                                                             |
| [getEventMetadataForEventAndProvider](functions/getEventMetadataForEventAndProvider.md) | Gets event metadata for a specific event code and provider.                                                                   |
| [getEventProviderById](functions/getEventProviderById.md)                               | Gets an event provider by ID.                                                                                                 |
