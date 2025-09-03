import type { CamelCasedProperties } from "type-fest";

/** Defines the structure of a field in a Commerce event subscription. */
export type CommerceEventSubscriptionField = {
  name: string;
  converter?: string;
};

/** Defines the structure of a filtering rule in a Commerce event subscription. */
export type CommerceEventSubscriptionRule = {
  field: string;
  value: string;
  operator: string;
};

/** Defines the structure of a Commerce event subscription. */
export type CommerceEventSubscription = {
  name: string;
  parent: string;
  provider_id: "default" | string;

  fields: CommerceEventSubscriptionField[];
  rules: CommerceEventSubscriptionRule[];

  destination: "default" | string;
  priority: boolean;
  hipaa_audit_required: boolean;
};

/** Defines the structure of the response of the GET Commerce API endpoint for event subscriptions. */
export type CommerceEventSubscriptionGetResponse =
  CamelCasedProperties<CommerceEventSubscription>;
