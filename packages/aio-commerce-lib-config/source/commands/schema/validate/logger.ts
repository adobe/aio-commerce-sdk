import AioLogger from "@adobe/aio-lib-core-logging";

/** The logger for the schema validate command */
export const logger = AioLogger(
  "@adobe/aio-commerce-lib-config:schema:validate",
  {
    level: process.env.LOG_LEVEL ?? "info",
  },
);
