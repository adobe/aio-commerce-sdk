import type { WebhooksConfig } from "./utils";

export function createWebhookSubscriptions(config: WebhooksConfig) {
  const webhookCount = config.webhooks.length;
  return { subscriptionsCreated: webhookCount };
}
