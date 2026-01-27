import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Config type when webhooks is present. */
export type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: unknown[];
};

/** Check if config has webhooks. */
export function hasWebhooks(
  config: CommerceAppConfigOutputModel,
): config is WebhooksConfig {
  return "webhooks" in config && Array.isArray(config.webhooks);
}
