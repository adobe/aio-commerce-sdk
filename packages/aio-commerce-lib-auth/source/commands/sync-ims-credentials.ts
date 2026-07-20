import { syncImsCredentials } from "@aio-commerce-sdk/scripting-utils/env";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import consola from "consola";

/** Synchronizes the current context IMS credentials to their AIO_COMMERCE_IMS_AUTH counterparts. */
export async function run() {
  consola.start("Syncing IMS credentials...");

  try {
    const result = await syncImsCredentials();

    if (!result.ok) {
      switch (result.reason) {
        case "missing-env":
          consola.warn(
            ".env not found — run `aio app use` to configure your workspace.",
          );
          break;
        case "no-ims-context":
          consola.warn(
            "No IMS context configured — run `aio login` to authenticate.",
          );
          break;
        default: {
          // exhaustiveness check — errors if a new reason is added without handling it
          const _: never = result.reason;
        }
      }
      return;
    }

    consola.success(
      "IMS credentials successfully synced to their AIO_COMMERCE_IMS_AUTH counterparts!",
    );
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}
