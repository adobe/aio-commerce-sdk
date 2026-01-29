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

import {
  resolveCommerceHttpClientParams,
  resolveIoEventsHttpClientParams,
} from "@adobe/aio-commerce-lib-api";
import { createCommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

import type { CommerceEventsApiClient } from "@adobe/aio-commerce-lib-events/commerce";
import type { AdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ExecutionContext,
  InstallationContext,
  StepContextFactory,
} from "#management/installation/workflow/step";

/** Config type when eventing is present. */
export type EventsConfig = CommerceAppConfigOutputModel & {
  eventing: NonNullable<CommerceAppConfigOutputModel["eventing"]>;
};

/** Context available to event steps (inherited from eventing branch). */
export interface EventsStepContext extends Record<string, unknown> {
  get ioEventsClient(): AdobeIoEventsApiClient;
  get commerceEventsClient(): CommerceEventsApiClient;
}

/** The execution context for event leaf steps. */
export type EventsExecutionContext = ExecutionContext<EventsStepContext>;

/** Creates the events step context with lazy-initialized API clients. */
export const createEventsStepContext: StepContextFactory<EventsStepContext> = (
  installation: InstallationContext,
) => {
  const { params } = installation;
  let ioEventsClient: AdobeIoEventsApiClient | null = null;
  let commerceEventsClient: CommerceEventsApiClient | null = null;

  return {
    get ioEventsClient() {
      if (ioEventsClient === null) {
        const ioEventsClientParams = resolveIoEventsHttpClientParams(params);
        ioEventsClient = createAdobeIoEventsApiClient(ioEventsClientParams);
      }

      return ioEventsClient;
    },

    get commerceEventsClient() {
      if (commerceEventsClient === null) {
        const commerceClientParams = resolveCommerceHttpClientParams(params);
        commerceEventsClient =
          createCommerceEventsApiClient(commerceClientParams);
      }

      return commerceEventsClient;
    },
  };
};
