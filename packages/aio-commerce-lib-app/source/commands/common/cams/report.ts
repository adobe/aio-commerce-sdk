/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { consola } from "consola";

import { CamsClientError } from "#commands/common/cams/errors";

/** How many causes {@link findCamsError} follows. */
const MAX_CAUSE_DEPTH = 5;

/** Finds the failure of the service that caused an error: the error itself or one of its causes. */
export function findCamsError(error: unknown) {
  let current = error;

  for (
    let depth = 0;
    depth < MAX_CAUSE_DEPTH && current instanceof Error;
    depth += 1
  ) {
    if (current instanceof CamsClientError) {
      return current;
    }

    current = current.cause;
  }
}

/**
 * One line with the facts that help to trace a failed call of the service: the HTTP status, the
 * code, and the method and path of the request.
 *
 * @returns The line, or `undefined` when the failure has none of them.
 */
export function describeCamsFailure(error: CamsClientError) {
  const facts = [
    error.status && `HTTP ${error.status}`,
    error.code && `code ${error.code}`,
    error.request && `${error.request.method} ${error.request.path}`,
  ].filter(Boolean);

  return facts.length > 0 ? `Details: ${facts.join(", ")}` : undefined;
}

/**
 * Prints a failure. A failure of the service is one block, the message and one line of details
 * without a stack, and the whole chain of causes goes to the debug log, which `DEBUG=1` shows.
 * Any other failure is unexpected, so it is printed with its stack and its causes.
 *
 * @param error - The failure.
 * @param message - What to print instead of the message of the error. Also keeps an unexpected
 * failure from printing its stack, because the caller chose how to describe it.
 */
export function reportFailure(error: unknown, message?: string) {
  const cams = findCamsError(error);

  if (!cams) {
    if (message !== undefined) {
      consola.error(message);
    } else if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }

    return;
  }

  const details = describeCamsFailure(cams);
  const headline =
    message ?? (error instanceof Error ? error.message : String(error));

  consola.error(details ? `${headline}\n${details}` : headline);
  consola.debug(error);
}
