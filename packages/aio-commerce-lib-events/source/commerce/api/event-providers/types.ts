/** Defines the structure of a Commerce event provider. */
export type CommerceEventProvider = {
  id: string;
  provider_id: string;
  instance_id?: string;
  label?: string;
  description?: string;
  workspace_configuration?: string;
};
