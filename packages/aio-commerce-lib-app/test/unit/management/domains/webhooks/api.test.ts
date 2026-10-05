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

import { describe, expect, test, vi } from "vitest";

import { createWebhookSubscription } from "#management/domains/webhooks/api";
import { makeHttpError } from "#test/fixtures/http-error";
import {
  createMockCommerceWebhooksClient,
  createMockResolvedWebhook,
} from "#test/fixtures/webhooks";

import type { WebhooksExecutionContext } from "#management/domains/webhooks/context";

function makeWebhookClient(
  subscribeWebhook = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext["commerceWebhooksClient"] {
  return createMockCommerceWebhooksClient({
    subscribeWebhook,
  });
}

describe("createWebhookSubscription", () => {
  const resolvedWebhook = createMockResolvedWebhook();

  test("calls subscribeWebhook and returns the resolved webhook", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const client = makeWebhookClient(subscribeWebhook);
    const result = await createWebhookSubscription(client, resolvedWebhook);

    expect(subscribeWebhook).toHaveBeenCalledWith(resolvedWebhook);
    expect(result).toBe(resolvedWebhook);
  });

  test("throws enriched error when HTTPError response body has a string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ message: "Duplicate webhook" }),
    );

    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body has no string message", async () => {
    const httpError = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ code: 422 }),
    );
    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });

  test("throws enriched error when response body cannot be parsed as JSON", async () => {
    const httpError = makeHttpError(400, "Bad Request", "{");
    const client = createMockCommerceWebhooksClient({
      subscribeWebhook: vi.fn().mockRejectedValue(httpError),
    });

    const error = await createWebhookSubscription(
      client,
      resolvedWebhook,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'Failed to create webhook subscription for "',
    );
    expect((error as Error).message).toContain("HTTP ");
  });
});

/** Minimal valid IMS params shared across resolveDeveloperConsoleOAuthCredentials tests. */
