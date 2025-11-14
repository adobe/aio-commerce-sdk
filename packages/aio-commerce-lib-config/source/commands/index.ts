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

import { run as generateActionsCommand } from "#commands/generate/actions/run";
import { run as generateSchemaCommand } from "#commands/generate/schema/run";
import { run as validateSchemaCommand } from "#commands/schema/validate/run";

const NAMESPACE = "@adobe/aio-commerce-lib-config";

const args = process.argv.slice(2);
const [command, subcommand] = args;

const USAGE = `
Usage: ${NAMESPACE} <command> [subcommand]

Commands:
  generate <target>    Generate artifacts
    schema             Generate configuration schema
    actions            Generate runtime actions

  validate <target>    Validate configuration
    schema             Validate configuration schema

  help                 Show this help message

Examples:
  ${NAMESPACE} generate schema
  ${NAMESPACE} generate actions
  ${NAMESPACE} validate schema
`;

/**
 * Command handlers registry mapping command names to their subcommand handlers
 */
const COMMANDS = {
  generate: {
    schema: generateSchemaCommand,
    actions: generateActionsCommand,
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
  const availableTargets = Object.keys(handlers).join(", ");

  const fallback = () => {
    process.stderr.write(
      `❌ Unknown ${commandName} target: ${target || "(none)"}`,
    );

    process.stdout.write(`\nAvailable targets: ${availableTargets}`);
    process.exit(1);
  };

  const handler = handlers[target] ?? fallback;
  await handler();
}

async function main() {
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  try {
    const handlers = COMMANDS[command as keyof typeof COMMANDS];

    if (!handlers) {
      process.stderr.write(`❌ Unknown command: ${command}`);
      process.stdout.write(USAGE);
      process.exit(1);
    }

    await handleCommand(command, subcommand, handlers);
  } catch (error) {
    process.stderr.write(
      `❌ Command failed: ${error instanceof Error ? error.message : error}`,
    );

    process.exit(1);
  }
}

main();
