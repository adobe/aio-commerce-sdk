# `getAllEventMetadataForProvider()`

```ts
function getAllEventMetadataForProvider(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  providerId: string;
},
   fetchOptions?: Options): Promise<{
  embedded: {
     description: string;
     embedded?: {
        sampleEvent?: {
           format: string;
           links: {
              self: {
                 deprecation?: ... | ...;
                 href: string;
                 hreflang?: ... | ...;
                 name?: ... | ...;
                 profile?: ... | ...;
                 seen?: ... | ...;
                 templated?: ... | ... | ...;
                 title?: ... | ...;
                 type?: ... | ...;
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
  }[];
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts#L47)

Gets all event metadata for a specific provider.

## Parameters

| Parameter           | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`        | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`            | \{ `providerId`: `string`; \}                                                                                                                                        | The parameters to get the event metadata with.                                                                                                                                                     |
| `params.providerId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`     | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<\{
`embedded`: \{
`description`: `string`;
`embedded?`: \{
`sampleEvent?`: \{
`format`: `string`;
`links`: \{
`self`: \{
`deprecation?`: ... \| ...;
`href`: `string`;
`hreflang?`: ... \| ...;
`name?`: ... \| ...;
`profile?`: ... \| ...;
`seen?`: ... \| ...;
`templated?`: ... \| ... \| ...;
`title?`: ... \| ...;
`type?`: ... \| ...;
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
\}[];
\}\>

## See

https://developer.adobe.com/events/docs/api#operation/getByProviderId

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
