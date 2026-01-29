# `getAllRegistrations()`

```ts
function getAllRegistrations(
   httpClient: AdobeIoEventsHttpClient,
   params: {
  consumerOrgId: string;
  projectId: string;
  workspaceId: string;
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

Defined in: [io-events/api/event-registrations/endpoints.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/endpoints.ts#L85)

Gets all event registrations for a workspace.

## Parameters

| Parameter              | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`           | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`               | \{ `consumerOrgId`: `string`; `projectId`: `string`; `workspaceId`: `string`; \}                                                                                     | The parameters to get the registrations with.                                                                                                                                                      |
| `params.consumerOrgId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.projectId?`    | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.workspaceId?`  | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
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

https://developer.adobe.com/events/docs/api#operation/getAllRegistrations

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
