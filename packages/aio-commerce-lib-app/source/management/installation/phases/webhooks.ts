import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import { CommerceAppConfigSchema } from "#config/schema/app";

import { definePhase } from "./define";

import type { SetRequiredDeep } from "type-fest";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  PhaseDef,
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
export type WebhooksPhaseConfig = SetRequiredDeep<
  CommerceAppConfigOutputModel,
  "webhooks"
>;

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

// Extends the default config schema with an additional check that allows to
// verify if the webhook configuration is in-place for this phase.
const HasWebhooksSchema = v.pipe(
  CommerceAppConfigSchema,
  v.check((_) => {
    // Returning false as schema for webhooks is still not defined.
    // Also because webhooks will not be implemented for now.
    return false;
  }),
);

/**
 * Type assert that verifies that the given config has webhooks that need to be installed.
 * @param config - The broad config to verify
 */
function assertHasWebhooks(
  config: CommerceAppConfigOutputModel,
): asserts config is WebhooksPhaseConfig {
  const result = v.safeParse(HasWebhooksSchema, config);

  if (!result.success) {
    throw new CommerceSdkValidationError("Invalid webhooks configuration", {
      issues: result.issues,
    });
  }
}

/** The runner function that will run all the steps of the webhooks phase */
export const webhooksPhaseRunner = definePhase(
  WEBHOOKS_PHASE_NAME,
  WEBHOOKS_PHASE_STEPS,
  webhooksPhaseExecutors,
  assertHasWebhooks,
);
