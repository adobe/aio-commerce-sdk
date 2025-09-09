# `createEventProvider()`

```ts
function createEventProvider(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
  dataResidencyRegion?: "va6" | "irl1";
  description?: string;
  docsUrl?: string;
  instanceId?: string;
  label: string;
  projectId: string;
  providerType?: "dx_commerce_events" | "3rd_party_custom_events";
  workspaceId: string;
},
   fetchOptions?: Options): Promise<{
  description?: string;
  docsUrl?: string;
  embedded?: {
     eventmetadata: {
        description: string;
        embedded?: {
           sampleEvent?: {
              format: string;
              links: {
                 self: ...;
              };
              samplePayload?: ... | ...;
           };
        };
        eventCode: string;
        label: string;
        links: {
           rel:sampleEvent?: {
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
           rel:update?: {
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
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/db09d0de34ee085849efca6e0213ea525d0165dc/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L136)

Creates an event provider.

## Parameters

| Parameter                     | Type                                                                                                                                                                                                                                                                                              | Description                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                  | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                                                                                                                      | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                      | \{ `consumerOrgId`: `string`; `dataResidencyRegion?`: `"va6"` \| `"irl1"`; `description?`: `string`; `docsUrl?`: `string`; `instanceId?`: `string`; `label`: `string`; `projectId`: `string`; `providerType?`: `"dx_commerce_events"` \| `"3rd_party_custom_events"`; `workspaceId`: `string`; \} | The parameters to create the event provider with.                                                                                                                                                          |
| `params.consumerOrgId`        | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.dataResidencyRegion?` | `"va6"` \| `"irl1"`                                                                                                                                                                                                                                                                               | -                                                                                                                                                                                                          |
| `params.description?`         | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.docsUrl?`             | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.instanceId?`          | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.label?`               | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.projectId?`           | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `params.providerType?`        | `"dx_commerce_events"` \| `"3rd_party_custom_events"`                                                                                                                                                                                                                                             | -                                                                                                                                                                                                          |
| `params.workspaceId?`         | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                          |
| `fetchOptions?`               | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                                                        | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                   |

## Returns

`Promise`\<\{
`description?`: `string`;
`docsUrl?`: `string`;
`embedded?`: \{
`eventmetadata`: \{
`description`: `string`;
`embedded?`: \{
`sampleEvent?`: \{
`format`: `string`;
`links`: \{
`self`: ...;
\};
`samplePayload?`: ... \| ...;
\};
\};
`eventCode`: `string`;
`label`: `string`;
`links`: \{
`rel:sampleEvent?`: \{
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
`rel:update?`: \{
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
\}\>

## See

https://developer.adobe.com/events/docs/api#operation/createProvider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
