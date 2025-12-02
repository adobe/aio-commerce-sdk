# `createEventMetadataForProvider()`

```ts
function createEventMetadataForProvider(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
  description: string;
  eventCode: string;
  label: string;
  projectId: string;
  providerId: string;
  sampleEventTemplate?:   | string
     | unknown[]
     | {
   [key: string]: unknown;
   };
  workspaceId: string;
},
   fetchOptions?: Options): Promise<{
  description: string;
  embedded?: {
     sampleEvent?: {
        format: string;
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
        samplePayload?: string;
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
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts:114](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts#L114)

Creates event metadata for a provider.

## Parameters

| Parameter                     | Type                                                                                                                                                                                                                                                                     | Description                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                  | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                                                                                                     | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                      | \{ `consumerOrgId`: `string`; `description`: `string`; `eventCode`: `string`; `label`: `string`; `projectId`: `string`; `providerId`: `string`; `sampleEventTemplate?`: \| `string` \| `unknown`[] \| \{ \[`key`: `string`\]: `unknown`; \}; `workspaceId`: `string`; \} | The parameters to create the event metadata with.                                                                                                                                                  |
| `params.consumerOrgId`        | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.description?`         | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.eventCode?`           | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.label?`               | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.projectId?`           | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.providerId?`          | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.sampleEventTemplate?` | \| `string` \| `unknown`[] \| \{ \[`key`: `string`\]: `unknown`; \}                                                                                                                                                                                                      | -                                                                                                                                                                                                  |
| `params.workspaceId?`         | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `fetchOptions?`               | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                               | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<\{
`description`: `string`;
`embedded?`: \{
`sampleEvent?`: \{
`format`: `string`;
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
`samplePayload?`: `string`;
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
\}\>

## See

https://developer.adobe.com/events/docs/api#operation/postEventMetadata

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
