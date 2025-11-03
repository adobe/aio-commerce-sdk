import AioLogger from "@adobe/aio-lib-core-logging";

export const logger = AioLogger(
  "@adobe/aio-commerce-lib-config:schema-validation",
  {
    level: process.env.LOG_LEVEL ?? "info",
  },
);
