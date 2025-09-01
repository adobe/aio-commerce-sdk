// Not exactly sure what is this, but it's present in a lot of responses of the Adobe I/O Events API.
// See: https://developer.adobe.com/events/docs/api#operation/postEventMetadata!c=201&path=_links/rel:sample_event&t=response
export type HALLink = {
  href: string;
  templated: boolean;
  type: string;
  deprecation: string;
  name: string;
  profile: string;
  title: string;
  hreflang: string;
  seen: string;
};
