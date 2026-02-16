#!/usr/bin/env node

/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import consola from "consola";

import { run as generateActionsCommand } from "#commands/generate/actions/run";
import { run as generateSchemaCommand } from "#commands/generate/schema/run";
import { run as validateSchemaCommand } from "#commands/schema/validate/run";

const NAMESPACE = "@adobe/aio-commerce-lib-config";

const args = process.argv.slice(2);
const [command, subcommand] = args;

const USAGE = `
Usage: ${NAMESPACE} <command> [target]

Commands:
  generate <target>    Generate artifacts
    all                Generate configuration schema and runtime actions
    schema             Generate configuration schema only
    actions            Generate runtime actions only

  validate <target>    Validate configuration
    schema             Validate configuration schema

  help                 Show this help message

Examples:
  ${NAMESPACE} generate all
  ${NAMESPACE} generate schema
  ${NAMESPACE} generate actions
  ${NAMESPACE} validate schema
`;

/**
 * Run all generate targets in sequence
 */
async function generateAll() {
  await generateSchemaCommand();
  consola.log.raw("");
  await generateActionsCommand();
}

/**
 * Command handlers registry mapping command names to their subcommand handlers
 */
const COMMANDS = {
  generate: {
    schema: generateSchemaCommand,
    actions: generateActionsCommand,
    all: generateAll,
  },
  validate: {
    schema: validateSchemaCommand,
  },
} as const;

/**
 * Generic command handler that dispatches to specific command implementations
 * @param commandName - The name of the command (for error messages)
 * @param target - The target subcommand to execute
 * @param handlers - Map of target names to handler functions
 */
async function handleCommand(
  commandName: string,
  target: string,
  handlers: Record<string, () => Promise<unknown>>,
) {
  if (!target) {
    const availableTargets = Object.keys(handlers).join(", ");
    consola.error(`No ${commandName} target specified`);
    consola.info(`Available targets: ${availableTargets}`);

    process.exit(1);
  }

  const handler = handlers[target];

  if (!handler) {
    const availableTargets = Object.keys(handlers).join(", ");
    consola.error(`Unknown ${commandName} target: ${target}`);
    consola.info(`Available targets: ${availableTargets}`);

    process.exit(1);
  }

  await handler();
}

async function main() {
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    consola.log.raw(USAGE);
    process.exit(0);
  }

  try {
    const handlers = COMMANDS[command as keyof typeof COMMANDS];

    if (!handlers) {
      consola.error(`Unknown command: ${command}`);
      consola.log.raw(USAGE);
      process.exit(1);
    }

    // Handle commands with subcommands (like generate, validate)
    await handleCommand(command, subcommand, handlers);
  } catch (error) {
    consola.error(stringifyError(error));
    process.exit(1);
  }
}

main();
