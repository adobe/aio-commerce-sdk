import { readFile } from "node:fs/promises";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParse } from "valibot";

import { RootSchema } from "./schema";

import type { AnySchema } from "valibot";

export async function check(configPath: string) {
  console.log(`Validating configuration file at path: ${configPath}`);
  if (!configPath.endsWith(".json")) {
    throw new Error("Configuration file must be a JSON file");
  }

  const configFile = await readFile(configPath, { encoding: "utf-8" });
  validate(JSON.parse(configFile));
}

export function validate(value: unknown, schema?: AnySchema) {
  const schemaToUse = schema ?? RootSchema;

  const { output, success, issues } = safeParse(schemaToUse, value);

  if (!success) {
    throw new CommerceSdkValidationError("Invalid configuration schema", {
      issues,
    });
  }

  return output;
}
