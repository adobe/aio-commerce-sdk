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

import { exec as generateActionsCommand } from "#commands/generate/actions/main";
import { exec as generateManifestCommand } from "#commands/generate/manifest/main";
import { exec as generateSchemaCommand } from "#commands/generate/schema/main";
import { exec as postinstallHookCommand } from "#commands/hooks/postinstall";
import { exec as preAppBuildHookCommand } from "#commands/hooks/pre-app-build";
import { exec as initCommand } from "#commands/init/main";

const NAMESPACE = "@adobe/aio-commerce-lib-app";

const args = process.argv.slice(2);
const [command, subcommand] = args;

const USAGE = `
Usage: ${NAMESPACE} <command> [target]

Commands:
  init                 Initialize the project (recommended for first-time setup)
  
  generate <target>    Generate artifacts
    all                Generate app manifest and runtime actions
    actions            Generate runtime actions only
    manifest           Generate app manifest only
    schema             Generate configuration schema only

  help                 Show this help message

Examples:
  ${NAMESPACE} init
  ${NAMESPACE} generate all
  ${NAMESPACE} generate manifest
  ${NAMESPACE} generate actions
  ${NAMESPACE} generate schema
`;

/** Run all generate targets in sequence */
async function generateAll() {
  await generateActionsCommand();
  consola.log.raw("");
  await generateManifestCommand();
  consola.log.raw("");
  await generateSchemaCommand();
}

/** Command handlers registry mapping command names to their subcommand handlers */
const COMMANDS = {
  init: initCommand,

  // Hooks are "internal" commands.
  // Users should not need to run these commands directly.
  hooks: {
    "pre-app-build": preAppBuildHookCommand,
    postinstall: postinstallHookCommand,
  },

  generate: {
    actions: generateActionsCommand,
    manifest: generateManifestCommand,
    schema: generateSchemaCommand,
    all: generateAll,
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
  function invalidTargetError(message: string) {
    consola.error(message);
    consola.info(`Available targets: ${Object.keys(handlers).join(" | ")}`);

    process.exit(1);
  }

  if (!target) {
    invalidTargetError(`No ${commandName} target specified`);
  }

  const handler = handlers[target];

  if (!handler) {
    invalidTargetError(`Unknown ${commandName} target: ${target}`);
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

    // Handle direct commands (like init) that don't have subcommands
    if (typeof handlers === "function") {
      await handlers();
      return;
    }

    // Handle commands with subcommands (like generate)
    await handleCommand(command, subcommand, handlers);
  } catch (error) {
    consola.error(stringifyError(error));
  }
}

main();
