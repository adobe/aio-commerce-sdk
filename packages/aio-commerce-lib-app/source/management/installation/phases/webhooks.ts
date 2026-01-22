import { createPhaseRunner } from "./define";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  PhaseDef,
  PhaseDefinition,
  PhaseExecutors,
  UnknownStepDef,
} from "#management/installation/types";

/** The name of this phase. */
const WEBHOOKS_PHASE_NAME = "webhooks";

/** The steps of the webhooks phase (in the order they should be executed) */
const WEBHOOKS_PHASE_STEPS = [
  "commerceSubscriptions",
] as const satisfies string[];

/** Describes the step for installing webhooks commerce subscriptions. */
type CommerceSubscriptionsStep = UnknownStepDef;

/** Describes the webhooks installation phase */
export type WebhooksPhase = PhaseDef<
  typeof WEBHOOKS_PHASE_NAME,
  typeof WEBHOOKS_PHASE_STEPS,
  {
    commerceSubscriptions: CommerceSubscriptionsStep;
  }
>;

/** Config type for the webhooks phase. Webhooks will be defined. */
export type WebhooksPhaseConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};

const webhooksPhaseExecutors: PhaseExecutors<
  WebhooksPhase,
  WebhooksPhaseConfig
> = {
  commerceSubscriptions: (config, { data, installationContext, helpers }) => {
    const { logger } = installationContext;
    logger.debug(config, data);

    return helpers.stepSuccess({});
  },
};

/**
 * Type guard that checks if the config has webhooks that need to be installed.
 * @param config - The config to check
 */
function hasWebhooks(
  config: CommerceAppConfigOutputModel,
): config is WebhooksPhaseConfig {
  // This will return always false as schema for webhooks is still not defined.
  // Not a problem because webhooks will not be implemented for now.
  return config.webhooks !== undefined;
}

/** The complete definition of the webhooks phase, including metadata for plan building. */
export const webhooksPhaseDefinition: PhaseDefinition<
  WebhooksPhase,
  WebhooksPhaseConfig
> = {
  name: WEBHOOKS_PHASE_NAME,
  order: WEBHOOKS_PHASE_STEPS,
  shouldRun: hasWebhooks,
  stepConditions: {},
  executors: webhooksPhaseExecutors,
};

/** The runner function that executes all steps of the webhooks phase. */
export const webhooksPhaseRunner = createPhaseRunner(webhooksPhaseDefinition);
