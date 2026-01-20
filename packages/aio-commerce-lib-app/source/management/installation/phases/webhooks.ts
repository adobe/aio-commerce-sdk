import { definePhase } from "./define";

import type { PhaseDef, UnknownStepDef } from "#management/installation/types";

/** The name of this phase. */
const WEBHOOKS_PHASE_NAME = "webhooks";

/** The steps of the webhooks phase (in the order they should be executed) */
const WEBHOOKS_PHASE_STEPS = [
  "commerceWebhookSubscriptions",
] as const satisfies string[];

/** Describes the step for installing webhooks commerce subscriptions. */
type CommerceSubscriptionsStep = UnknownStepDef;

/** Describes the webhooks installation phase */
export type WebhooksPhase = PhaseDef<
  typeof WEBHOOKS_PHASE_NAME,
  typeof WEBHOOKS_PHASE_STEPS,
  {
    commerceWebhookSubscriptions: CommerceSubscriptionsStep;
  }
>;

/** The runner function that will run all the steps of the webhooks phase */
export const webhooksPhaseRunner = definePhase(
  WEBHOOKS_PHASE_NAME,
  WEBHOOKS_PHASE_STEPS,
  {
    commerceWebhookSubscriptions: (config, { data, helpers }) => {
      console.log(config, data);
      return helpers.stepSuccess({});
    },
  },
);
