# `@adobe/aio-commerce-lib-events` Documentation

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

## Overview

The library provides two main event management APIs:

- **Commerce Events API**: For managing event providers, subscriptions, and configuration within Adobe Commerce instances
- **Adobe I/O Events API**: For managing event providers and metadata in the Adobe I/O Events platform

These APIs abstract the complexity of event management, making it easy to create, configure, and manage event-driven integrations in your App Builder applications.

## Reference

See the [API Reference](./api-reference/README.md) for more details.

## How to use

### Commerce Events API

The Commerce Events API allows you to manage event providers, subscriptions, and configuration within Adobe Commerce instances. Below you'll find usage examples for some of the operations. Find them all in the [API reference for the Commerce entrypoint](./api-reference/commerce/README.md).

#### Creating a Commerce Events API Client

```typescript
import { createCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";

// For SaaS Commerce instances
const commerceEventsClient = createCommerceEventsApiClient({
  config: {
    baseUrl: "https://api.commerce.adobe.com",
    flavor: "saas",
  },
  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
    environment: "prod",
  },
});

// For PaaS Commerce instances
const commerceEventsClient = createCommerceEventsApiClient({
  config: {
    baseUrl: "https://your-commerce-instance.com",
    flavor: "paas",
  },
  auth: {
    // Integration auth params
    accessToken: "your-access-token",
    accessTokenSecret: "your-access-token-secret",
    consumerKey: "your-consumer-key",
    consumerSecret: "your-consumer-secret",
  },
});
```

#### Managing Event Providers

```typescript
// List all event providers
const providers = await commerceEventsClient.getAllEventProviders();

// Get a specific event provider
const provider = await commerceEventsClient.getEventProviderById({
  providerId: "my-provider-id",
});

// Create a new event provider
const newProvider = await commerceEventsClient.createEventProvider({
  providerId: "my-new-provider",
  instanceId: "my-instance-id",
  label: "My Event Provider",
  description: "Description of my event provider",
  associatedWorkspaceConfiguration: {
    // Workspace configuration object
  },
});
```

#### Managing Event Subscriptions

```typescript
// List all event subscriptions
const subscriptions = await commerceEventsClient.getAllEventSubscriptions();

// Create a new event subscription
const subscription = await commerceEventsClient.createEventSubscription({
  name: "my-subscription",
  providerId: "my-provider-id",
  fields: [{ name: "order_id" }, { name: "customer_email" }],
});
```

#### Updating Eventing Configuration

```typescript
// Enable or disable eventing
await commerceEventsClient.updateEventingConfiguration({
  enabled: true,
});
```

### Adobe I/O Events API

The Adobe I/O Events API allows you to manage event providers and metadata in the Adobe I/O Events platform. Below you'll find usage examples for some of the operations. Find them all in the [API reference for the I/O Events entrypoint](./api-reference/io-events/README.md).

#### Creating an Adobe I/O Events API Client

```typescript
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

const ioEventsClient = createAdobeIoEventsApiClient({
  config: {
    baseUrl: "https://api.adobe.io/events", // optional, this is the default
  },
  auth: {
    // IMS auth params
    clientId: "your-client-id",
    clientSecrets: ["your-client-secret"],
    technicalAccountId: "your-technical-account-id",
    technicalAccountEmail: "your-technical-account-email",
    imsOrgId: "your-ims-org-id",
    environment: "prod",
  },
});
```

#### Managing Event Providers

```typescript
// List all event providers for a consumer organization
const providers = await ioEventsClient.getAllEventProviders({
  consumerOrgId: "your-consumer-org-id",
});

// Get a specific event provider
const provider = await ioEventsClient.getEventProviderById({
  providerId: "my-provider-id",
});

// Create a new event provider
const newProvider = await ioEventsClient.createEventProvider({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  instanceId: "my-instance-id",
  label: "My Event Provider",
  description: "Description of my event provider",
});

// Create a Commerce-specific event provider
const commerceProvider = await ioEventsClient.createCommerceEventProvider({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  instanceId: "my-instance-id",
  label: "My Commerce Provider",
  description: "Description of my Commerce provider",
});

// Create a 3rd party custom event provider
const customProvider = await ioEventsClient.create3rdPartyCustomEventProvider({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  instanceId: "my-instance-id",
  label: "My Custom Provider",
  description: "Description of my custom provider",
});
```

#### Managing Event Metadata

```typescript
// Get all event metadata for a provider
const metadata = await ioEventsClient.getAllEventMetadataForProvider({
  providerId: "my-provider-id",
});

// Get specific event metadata
const eventMetadata = await ioEventsClient.getEventMetadataForEventAndProvider({
  providerId: "my-provider-id",
  eventCode: "my-event-code",
});

// Create new event metadata
const newMetadata = await ioEventsClient.createEventMetadataForProvider({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  providerId: "my-provider-id",
  label: "My Event",
  description: "Description of my event",
  eventCode: "my-event-code",
});
```

#### Managing Event Registrations

```typescript
// List all registrations for a consumer organization
const registrations = await ioEventsClient.getAllRegistrationsByConsumerOrg({
  consumerOrgId: "your-consumer-org-id",
});

// List all registrations for a project and workspace
const registrations = await ioEventsClient.getAllRegistrations({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
});

// Get a specific registration by ID
const registration = await ioEventsClient.getRegistrationById({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  registrationId: "my-registration-id",
});

// Create a new registration
const registration = await ioEventsClient.createRegistration({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  name: "my-registration",
  deliveryType: "webhook",
  eventsOfInterest: [
    {
      providerId: "my-provider-id",
      eventCode: "my-event-code",
    },
  ],
});

// Update a registration
const updatedRegistration = await ioEventsClient.updateRegistration({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  registrationId: "my-registration-id",
  name: "my-updated-registration",
  deliveryType: "webhook",
  eventsOfInterest: [
    {
      providerId: "my-provider-id",
      eventCode: "my-event-code",
    },
  ],
});

// Delete a registration
await ioEventsClient.deleteRegistration({
  consumerOrgId: "your-consumer-org-id",
  projectId: "your-project-id",
  workspaceId: "your-workspace-id",
  registrationId: "my-registration-id",
});
```

### Custom API Clients

> [!TIP]
> We recommend creating custom API clients with only the functions you need for better performance. This way your build tool will be able to tree-shake the unused functions and reduce the bundle size, leading to faster startup times, which is especially important for App Builder-based applications (lower cold start times).

You can create custom API clients with only the functions you need:

```typescript
import { createCustomCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";

// Create a custom client with only specific functions
const customClient = createCustomCommerceEventsApiClient(
  {
    config: { baseUrl: "https://api.commerce.adobe.com", flavor: "saas" },
    auth: {
      /* auth params */
    },
  },
  {
    // Only include the functions you need
    getAllEventProviders,
    createEventProvider,
  },
);
```

### Error Handling

The library uses validation to ensure all required parameters are provided and correctly formatted. When validation fails, a `CommerceSdkValidationError` is thrown with detailed information about what went wrong.

```typescript
import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";

try {
  await commerceEventsClient.getEventProviderById({
    providerId: "", // Invalid empty string
  });
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error(error.display());
    // Output:
    // Invalid input
    // └── Schema validation error at providerId → Expected a non-empty string value for the event provider ID
  }
}
```

### Advanced Usage

#### Custom Fetch Options

You can provide custom fetch options for individual requests:

```typescript
// Add custom headers or other fetch options
const providers = await commerceEventsClient.getAllEventProviders({
  headers: {
    "X-Custom-Header": "custom-value",
  },

  timeout: 30000, // 30 seconds
});
```

#### Using Pre-initialized Auth Providers

You can also use pre-initialized auth providers from the auth library:

```typescript
import { getImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

const authProvider = getImsAuthProvider({
  clientId: "...",
  clientSecrets: ["..."],
  // ...
});

const client = createCommerceEventsApiClient({
  config: { baseUrl: "https://api.commerce.adobe.com", flavor: "saas" },
  auth: authProvider, // Use the provider directly
});
```

## Best Practices

1. **Always validate parameters** - The library validates parameters automatically, but handle validation errors gracefully
2. **Handle errors appropriately** - Catch and properly handle validation and HTTP errors
3. **Use custom clients** - Create custom API clients with only the functions you need for better performance
4. **Use TypeScript** - The library is fully typed, so your editor will help you with the correct response field names
5. **Configure timeouts** - Set appropriate timeouts for your use case to avoid hanging requests
