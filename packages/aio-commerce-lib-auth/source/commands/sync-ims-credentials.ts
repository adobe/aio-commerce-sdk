import { syncImsCredentials } from "@aio-commerce-sdk/scripting-utils/env";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import consola from "consola";

/** Synchronizes the current context IMS credentials to their AIO_COMMERCE_IMS_AUTH counterparts. */
export async function run() {
  consola.start("Syncing IMS credentials...");

  try {
    await syncImsCredentials();
    consola.success(
      "IMS credentials successfully synced to their AIO_COMMERCE_IMS_AUTH counterparts!",
    );
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}
