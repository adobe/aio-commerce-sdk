import AioLogger from "@adobe/aio-lib-core-logging";

/** The logger for the pre-app-build hook */
export const logger = AioLogger(
  "@adobe/aio-commerce-lib-config:generate:actions",
  {
    level: process.env.LOG_LEVEL ?? "info",
  },
);
