import { definePhase } from "../runner";

import type {
  PhaseDef,
  PhaseExecutors,
  UnknownStepDef,
} from "#management/installation/types";

/** The steps of the webhooks phase (in the order they should be executed) */
const WEBHOOKS_PHASE_STEPS = [
  "commerceWebhookSubscriptions",
] as const satisfies string[];

/** Describes the step for installing webhooks commerce subscriptions. */
type CommerceSubscriptionsStep = UnknownStepDef;

/** Describes the webhooks installation phase */
export type WebhooksPhase = PhaseDef<
  "webhooks",
  typeof WEBHOOKS_PHASE_STEPS,
  {
    commerceWebhookSubscriptions: CommerceSubscriptionsStep;
  }
>;

/** The registry of executors for the webhooks phase */
const webhooksPhaseExecutors: PhaseExecutors<WebhooksPhase> = {
  commerceWebhookSubscriptions: async (config, { data, helpers }) => {
    console.log(config, data);
    return helpers.stepSuccess({});
  },
};

/** The runner function that will run all the steps of the webhooks phase */
export const webhooksPhaseRunner = definePhase(
  "webhooks",
  WEBHOOKS_PHASE_STEPS,
  webhooksPhaseExecutors,
);
