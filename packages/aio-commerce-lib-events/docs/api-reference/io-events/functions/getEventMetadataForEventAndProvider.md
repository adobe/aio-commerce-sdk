# `getEventMetadataForEventAndProvider()`

```ts
function getEventMetadataForEventAndProvider(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  eventCode: string;
  providerId: string;
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

Defined in: [packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts:79](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts#L79)

Gets event metadata for a specific event code and provider.

## Parameters

| Parameter            | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`         | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`             | \{ `eventCode`: `string`; `providerId`: `string`; \}                                                                                                                 | The parameters to get the event metadata with.                                                                                                                                                     |
| `params.eventCode`   | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.providerId?` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`      | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

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

https://developer.adobe.com/events/docs/api#operation/getByProviderIdAndEventCode

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
