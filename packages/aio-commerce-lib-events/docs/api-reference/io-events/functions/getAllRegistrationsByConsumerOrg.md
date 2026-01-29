# `getAllRegistrationsByConsumerOrg()`

```ts
function getAllRegistrationsByConsumerOrg(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
},
   fetchOptions?: Options): Promise<{
  embedded: {
     registrations: {
        clientId: string;
        createdDate?: string;
        deliveryType: "webhook" | "webhook_batch" | "journal" | "aws_eventbridge";
        description?: string;
        destinationMetadata?: {
           awsAccountId?: string;
           awsRegion?: string;
        };
        enabled?: boolean;
        eventsOfInterest: {
           eventCode: string;
           providerId: string;
           providerMetadataId?: string;
        }[];
        eventsUrl?: string;
        id: string;
        integrationStatus: string;
        links: {
           rel:delete?: {
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
           rel:events?: {
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
        name: string;
        parentClientId?: string;
        registrationId: string;
        runtimeAction?: string;
        status: string;
        subscriberFilters?: {
           description?: string;
           id?: string;
           name: string;
           subscriberFilter: string;
        }[];
        type: string;
        updatedDate?: string;
        webhookUrl?: string;
     }[];
  };
  links: {
     first?: {
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
     last?: {
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
     next?: {
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
     prev?: {
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
  page: {
     number: number;
     numberOfElements: number;
     size: number;
     totalElements: number;
     totalPages: number;
  };
}>;
```

Defined in: [io-events/api/event-registrations/endpoints.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/endpoints.ts#L53)

Gets all event registrations for a consumer organization (paginated).

## Parameters

| Parameter              | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`           | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`               | \{ `consumerOrgId`: `string`; \}                                                                                                                                     | The parameters to get the registrations with.                                                                                                                                                      |
| `params.consumerOrgId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`        | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<\{
`embedded`: \{
`registrations`: \{
`clientId`: `string`;
`createdDate?`: `string`;
`deliveryType`: `"webhook"` \| `"webhook_batch"` \| `"journal"` \| `"aws_eventbridge"`;
`description?`: `string`;
`destinationMetadata?`: \{
`awsAccountId?`: `string`;
`awsRegion?`: `string`;
\};
`enabled?`: `boolean`;
`eventsOfInterest`: \{
`eventCode`: `string`;
`providerId`: `string`;
`providerMetadataId?`: `string`;
\}[];
`eventsUrl?`: `string`;
`id`: `string`;
`integrationStatus`: `string`;
`links`: \{
`rel:delete?`: \{
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
`rel:events?`: \{
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
`name`: `string`;
`parentClientId?`: `string`;
`registrationId`: `string`;
`runtimeAction?`: `string`;
`status`: `string`;
`subscriberFilters?`: \{
`description?`: `string`;
`id?`: `string`;
`name`: `string`;
`subscriberFilter`: `string`;
\}[];
`type`: `string`;
`updatedDate?`: `string`;
`webhookUrl?`: `string`;
\}[];
\};
`links`: \{
`first?`: \{
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
`last?`: \{
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
`next?`: \{
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
`prev?`: \{
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
`page`: \{
`number`: `number`;
`numberOfElements`: `number`;
`size`: `number`;
`totalElements`: `number`;
`totalPages`: `number`;
\};
\}\>

## See

https://developer.adobe.com/events/docs/api#operation/getAllRegistrationsForOrg

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
