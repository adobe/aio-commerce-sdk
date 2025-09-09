# `getAllCommerceEventProviders()`

```ts
function getAllCommerceEventProviders(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
  filterBy?: {
     instanceId?: string;
     providerTypes?: ("dx_commerce_events" | "3rd_party_custom_events")[];
  };
  withEventMetadata?: boolean;
},
   fetchOptions?: Options): Promise<{
  embedded: {
     providers: {
        description?: string;
        docsUrl?: string;
        embedded?: {
           eventmetadata: {
              description: string;
              embedded?: {
                 sampleEvent?: ...;
              };
              eventCode: string;
              label: string;
              links: {
                 rel:sampleEvent?: ... | ...;
                 rel:update?: ... | ...;
                 self: {
                    deprecation?: ...;
                    href: ...;
                    hreflang?: ...;
                    name?: ...;
                    profile?: ...;
                    seen?: ...;
                    templated?: ...;
                    title?: ...;
                    type?: ...;
                 };
              };
           }[];
        };
        eventDeliveryFormat: string;
        id: string;
        instanceId?: string;
        label: string;
        links: {
           rel:eventmetadata?: {
              deprecation?: string;
              href: string;
              hreflang?: string;
              name?: string;
              profile?: string;
              seen?: string;
              templated?: boolean;
              title?: string;
              type?: string;
           };
           self: {
              deprecation?: string;
              href: string;
              hreflang?: string;
              name?: string;
              profile?: string;
              seen?: string;
              templated?: boolean;
              title?: string;
              type?: string;
           };
        };
        providerMetadata: string;
        publisher: string;
        source: string;
     }[];
  };
  links: {
     self: {
        deprecation?: string;
        href: string;
        hreflang?: string;
        name?: string;
        profile?: string;
        seen?: string;
        templated?: boolean;
        title?: string;
        type?: string;
     };
  };
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/shorthands.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/io-events/api/event-providers/shorthands.ts#L26)

Lists all Commerce (of type `dx_commerce_events`) event providers for the given consumer organization ID.

## Parameters

| Parameter                        | Type                                                                                                                                                                                        | Description                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                     | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                         | \{ `consumerOrgId`: `string`; `filterBy?`: \{ `instanceId?`: `string`; `providerTypes?`: (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]; \}; `withEventMetadata?`: `boolean`; \} | The parameters to list the event providers with.                                                                                                                                                           |
| `params.consumerOrgId`           | `string`                                                                                                                                                                                    | -                                                                                                                                                                                                          |
| `params.filterBy?`               | \{ `instanceId?`: `string`; `providerTypes?`: (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]; \}                                                                                 | -                                                                                                                                                                                                          |
| `params.filterBy.instanceId?`    | `string`                                                                                                                                                                                    | -                                                                                                                                                                                                          |
| `params.filterBy.providerTypes?` | (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]                                                                                                                                   | -                                                                                                                                                                                                          |
| `params.withEventMetadata?`      | `boolean`                                                                                                                                                                                   | -                                                                                                                                                                                                          |
| `fetchOptions?`                  | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                  | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                   |

## Returns

`Promise`\<\{
`embedded`: \{
`providers`: \{
`description?`: `string`;
`docsUrl?`: `string`;
`embedded?`: \{
`eventmetadata`: \{
`description`: `string`;
`embedded?`: \{
`sampleEvent?`: ...;
\};
`eventCode`: `string`;
`label`: `string`;
`links`: \{
`rel:sampleEvent?`: ... \| ...;
`rel:update?`: ... \| ...;
`self`: \{
`deprecation?`: ...;
`href`: ...;
`hreflang?`: ...;
`name?`: ...;
`profile?`: ...;
`seen?`: ...;
`templated?`: ...;
`title?`: ...;
`type?`: ...;
\};
\};
\}[];
\};
`eventDeliveryFormat`: `string`;
`id`: `string`;
`instanceId?`: `string`;
`label`: `string`;
`links`: \{
`rel:eventmetadata?`: \{
`deprecation?`: `string`;
`href`: `string`;
`hreflang?`: `string`;
`name?`: `string`;
`profile?`: `string`;
`seen?`: `string`;
`templated?`: `boolean`;
`title?`: `string`;
`type?`: `string`;
\};
`self`: \{
`deprecation?`: `string`;
`href`: `string`;
`hreflang?`: `string`;
`name?`: `string`;
`profile?`: `string`;
`seen?`: `string`;
`templated?`: `boolean`;
`title?`: `string`;
`type?`: `string`;
\};
\};
`providerMetadata`: `string`;
`publisher`: `string`;
`source`: `string`;
\}[];
\};
`links`: \{
`self`: \{
`deprecation?`: `string`;
`href`: `string`;
`hreflang?`: `string`;
`name?`: `string`;
`profile?`: `string`;
`seen?`: `string`;
`templated?`: `boolean`;
`title?`: `string`;
`type?`: `string`;
\};
\};
\}\>

## See

https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
