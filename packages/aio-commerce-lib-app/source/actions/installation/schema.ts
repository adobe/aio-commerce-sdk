import * as v from "valibot";

import { LifecycleRequestContextSchema } from "#management/common/schema";

/** Request body for POST / and POST /validation — the shared lifecycle request shape. */
export const InstallationRequestBodySchema = LifecycleRequestContextSchema;

const {
  commerceBaseUrl: _,
  commerceEnv: __,
  ...upgradeSchema
} = LifecycleRequestContextSchema.entries;

/** Request body for POST /upgrade. */
export const UpgradeRequestBodySchema = v.object(upgradeSchema);
