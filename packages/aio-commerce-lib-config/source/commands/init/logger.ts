import AioLogger from "@adobe/aio-lib-core-logging";

/** The logger for the init command */
export const logger = AioLogger("@adobe/aio-commerce-lib-config:init", {
  level: process.env.LOG_LEVEL ?? "info",
});
