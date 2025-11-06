# `getEventProviderById()`

```ts
function getEventProviderById(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  providerId: string;
  withEventMetadata?: boolean;
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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L91)

Gets an event provider by ID.

## Parameters

| Parameter                   | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                    | \{ `providerId`: `string`; `withEventMetadata?`: `boolean`; \}                                                                                                       | The parameters to get the event provider by.                                                                                                                                                       |
| `params.providerId`         | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.withEventMetadata?` | `boolean`                                                                                                                                                            | -                                                                                                                                                                                                  |
| `fetchOptions?`             | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

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

https://developer.adobe.com/events/docs/api#operation/getProvidersById

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
