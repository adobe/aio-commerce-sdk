# `io-events`: Module

## Type Aliases

| Type Alias                                                                                             | Description                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [AdobeIoEventsApiClient](type-aliases/AdobeIoEventsApiClient.md)                                       | An API Client for the Adobe I/O Events API.                                                                                |
| [CreateEventMetadataForProviderParams](type-aliases/CreateEventMetadataForProviderParams.md)           | The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.             |
| [CreateRegistrationParams](type-aliases/CreateRegistrationParams.md)                                   | The parameters for creating a registration.                                                                                |
| [DeleteRegistrationParams](type-aliases/DeleteRegistrationParams.md)                                   | The parameters for deleting a registration.                                                                                |
| [DeliveryType](type-aliases/DeliveryType.md)                                                           | The delivery type for a registration.                                                                                      |
| [EventProviderCreateParams](type-aliases/EventProviderCreateParams.md)                                 | The schema of the parameters received by the POST `providers` Adobe I/O Events API endpoint.                               |
| [EventProviderGetByIdParams](type-aliases/EventProviderGetByIdParams.md)                               | The schema of the parameters received by the GET `providers/:id` Adobe I/O Events API endpoint.                            |
| [EventProviderListAllParams](type-aliases/EventProviderListAllParams.md)                               | Defines the parameters received by the GET `providers` Adobe I/O Events API endpoint.                                      |
| [GetAllEventMetadataForProviderParams](type-aliases/GetAllEventMetadataForProviderParams.md)           | The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.              |
| [GetAllRegistrationsByConsumerOrgParams](type-aliases/GetAllRegistrationsByConsumerOrgParams.md)       | The parameters for getting all registrations for a consumer organization.                                                  |
| [GetAllRegistrationsParams](type-aliases/GetAllRegistrationsParams.md)                                 | The parameters for getting all registrations for a workspace.                                                              |
| [GetEventMetadataForEventAndProviderParams](type-aliases/GetEventMetadataForEventAndProviderParams.md) | The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.        |
| [GetRegistrationByIdParams](type-aliases/GetRegistrationByIdParams.md)                                 | The parameters for getting a registration by ID.                                                                           |
| [IoEventMetadata](type-aliases/IoEventMetadata.md)                                                     | Defines the base fields of an event metadata entity.                                                                       |
| [IoEventMetadataManyResponse](type-aliases/IoEventMetadataManyResponse.md)                             | Defines the fields of many event metadata entities returned by the Adobe I/O Events API.                                   |
| [IoEventMetadataOneResponse](type-aliases/IoEventMetadataOneResponse.md)                               | Defines the fields of an event metadata entity returned by the Adobe I/O Events API.                                       |
| [IoEventProvider](type-aliases/IoEventProvider.md)                                                     | Defines the base fields of an I/O event provider entity.                                                                   |
| [IoEventProviderManyResponse](type-aliases/IoEventProviderManyResponse.md)                             | Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API.                               |
| [IoEventProviderOneResponse](type-aliases/IoEventProviderOneResponse.md)                               | Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API.                                   |
| [IoEventRegistration](type-aliases/IoEventRegistration.md)                                             | Defines the base fields of an I/O event registration entity.                                                               |
| [IoEventRegistrationManyResponse](type-aliases/IoEventRegistrationManyResponse.md)                     | Defines the fields of many I/O event registration entities returned by the Adobe I/O Events API (workspace-specific).      |
| [IoEventRegistrationOneResponse](type-aliases/IoEventRegistrationOneResponse.md)                       | Defines the fields of an I/O event registration entity returned by the Adobe I/O Events API.                               |
| [IoEventRegistrationPaginatedResponse](type-aliases/IoEventRegistrationPaginatedResponse.md)           | Defines the fields of paginated I/O event registration entities returned by the Adobe I/O Events API (consumer org-level). |
| [PageMetadata](type-aliases/PageMetadata.md)                                                           | Defines the pagination metadata for paginated responses.                                                                   |
| [SubscriberFilter](type-aliases/SubscriberFilter.md)                                                   | The subscriber-defined filter for a registration.                                                                          |
| [SubscriberFilterModel](type-aliases/SubscriberFilterModel.md)                                         | Defines a subscriber-defined filter (from API response).                                                                   |
| [UpdateRegistrationParams](type-aliases/UpdateRegistrationParams.md)                                   | The parameters for updating a registration.                                                                                |

## Variables

| Variable                                                                                                  | Description                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [CreateEventMetadataForProviderSchema](variables/CreateEventMetadataForProviderSchema.md)                 | The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.      |
| [CreateRegistrationParamsSchema](variables/CreateRegistrationParamsSchema.md)                             | Schema for creating a registration.                                                                                 |
| [DeleteRegistrationParamsSchema](variables/DeleteRegistrationParamsSchema.md)                             | Schema for deleting a registration.                                                                                 |
| [DeliveryTypeSchema](variables/DeliveryTypeSchema.md)                                                     | Schema for delivery type validation.                                                                                |
| [DestinationMetadataSchema](variables/DestinationMetadataSchema.md)                                       | Schema for AWS EventBridge destination metadata.                                                                    |
| [EventProviderCreateParamsSchema](variables/EventProviderCreateParamsSchema.md)                           | -                                                                                                                   |
| [EventProviderGetByIdParamsSchema](variables/EventProviderGetByIdParamsSchema.md)                         | -                                                                                                                   |
| [EventProviderListAllParamsSchema](variables/EventProviderListAllParamsSchema.md)                         | -                                                                                                                   |
| [EventsOfInterestSchema](variables/EventsOfInterestSchema.md)                                             | Schema for events of interest.                                                                                      |
| [GetAllEventMetadataForProviderSchema](variables/GetAllEventMetadataForProviderSchema.md)                 | The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.       |
| [GetAllRegistrationsByConsumerOrgParamsSchema](variables/GetAllRegistrationsByConsumerOrgParamsSchema.md) | Schema for getting all registrations for a consumer organization.                                                   |
| [GetAllRegistrationsParamsSchema](variables/GetAllRegistrationsParamsSchema.md)                           | Schema for getting all registrations for a workspace.                                                               |
| [GetEventMetadataForEventAndProviderSchema](variables/GetEventMetadataForEventAndProviderSchema.md)       | The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint. |
| [GetRegistrationByIdParamsSchema](variables/GetRegistrationByIdParamsSchema.md)                           | Schema for getting a registration by ID.                                                                            |
| [SubscriberFilterSchema](variables/SubscriberFilterSchema.md)                                             | Schema for subscriber-defined filter.                                                                               |
| [UpdateRegistrationParamsSchema](variables/UpdateRegistrationParamsSchema.md)                             | Schema for updating a registration.                                                                                 |

## Functions

| Function                                                                                | Description                                                                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [create3rdPartyCustomEventProvider](functions/create3rdPartyCustomEventProvider.md)     | Creates a 3rd Party Custom Events (of type `3rd_party_custom_events`) event provider.                                         |
| [createAdobeIoEventsApiClient](functions/createAdobeIoEventsApiClient.md)               | Creates a new API client for the Adobe I/O Events API client.                                                                 |
| [createCommerceEventProvider](functions/createCommerceEventProvider.md)                 | Creates a Commerce (of type `dx_commerce_events`) event provider.                                                             |
| [createCustomAdobeIoEventsApiClient](functions/createCustomAdobeIoEventsApiClient.md)   | Creates a customized Adobe I/O Events API client.                                                                             |
| [createEventMetadataForProvider](functions/createEventMetadataForProvider.md)           | Creates event metadata for a provider.                                                                                        |
| [createEventProvider](functions/createEventProvider.md)                                 | Creates an event provider.                                                                                                    |
| [createRegistration](functions/createRegistration.md)                                   | Creates an event registration.                                                                                                |
| [deleteRegistration](functions/deleteRegistration.md)                                   | Deletes an event registration.                                                                                                |
| [getAll3rdPartyCustomEventProviders](functions/getAll3rdPartyCustomEventProviders.md)   | Lists all 3rd Party Custom Events (of type `3rd_party_custom_events`) event providers for the given consumer organization ID. |
| [getAllCommerceEventProviders](functions/getAllCommerceEventProviders.md)               | Lists all Commerce (of type `dx_commerce_events`) event providers for the given consumer organization ID.                     |
| [getAllEventMetadataForProvider](functions/getAllEventMetadataForProvider.md)           | Gets all event metadata for a specific provider.                                                                              |
| [getAllEventProviders](functions/getAllEventProviders.md)                               | Lists all event providers for the given consumer organization ID.                                                             |
| [getAllRegistrations](functions/getAllRegistrations.md)                                 | Gets all event registrations for a workspace.                                                                                 |
| [getAllRegistrationsByConsumerOrg](functions/getAllRegistrationsByConsumerOrg.md)       | Gets all event registrations for a consumer organization (paginated).                                                         |
| [getEventMetadataForEventAndProvider](functions/getEventMetadataForEventAndProvider.md) | Gets event metadata for a specific event code and provider.                                                                   |
| [getEventProviderById](functions/getEventProviderById.md)                               | Gets an event provider by ID.                                                                                                 |
| [getRegistrationById](functions/getRegistrationById.md)                                 | Gets an event registration by ID.                                                                                             |
| [updateRegistration](functions/updateRegistration.md)                                   | Updates an event registration.                                                                                                |
