# `createCommerceEventProvider()`

```ts
function createCommerceEventProvider(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
  dataResidencyRegion?: "va6" | "irl1";
  description?: string;
  docsUrl?: string;
  instanceId?: string;
  label: string;
  projectId: string;
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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/shorthands.ts:93](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-events/source/io-events/api/event-providers/shorthands.ts#L93)

Creates a Commerce (of type `dx_commerce_events`) event provider.

## Parameters

| Parameter                     | Type                                                                                                                                                                                                                      | Description                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                  | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                                                      | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                      | \{ `consumerOrgId`: `string`; `dataResidencyRegion?`: `"va6"` \| `"irl1"`; `description?`: `string`; `docsUrl?`: `string`; `instanceId?`: `string`; `label`: `string`; `projectId`: `string`; `workspaceId`: `string`; \} | The parameters to create the event provider with.                                                                                                                                                  |
| `params.consumerOrgId`        | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.dataResidencyRegion?` | `"va6"` \| `"irl1"`                                                                                                                                                                                                       | -                                                                                                                                                                                                  |
| `params.description?`         | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.docsUrl?`             | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.instanceId?`          | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.label?`               | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.projectId?`           | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.workspaceId?`         | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `fetchOptions?`               | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

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
