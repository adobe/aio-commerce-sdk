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

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import AioLogger from "@adobe/aio-lib-core-logging";

import { getAllScopeData } from "#api/commerce";

import { buildUpdatedScopeTree, mergeCommerceScopes } from "./merge-scopes";
import * as scopeTreeRepository from "./scope-tree-repository";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type {
  GetScopeTreeOptions,
  GetScopeTreeResult,
  ScopeTreeContext,
} from "./types";

const logger = AioLogger("@adobe/aio-commerce-lib-config:get-scope-tree", {
  level: process.env.LOG_LEVEL ?? "info",
});

function hasCommerceConfig(ctx: ScopeTreeContext): ctx is ScopeTreeContext & {
  commerceConfig: CommerceHttpClientParams;
} {
  return !!ctx.commerceConfig;
}

/**
 * Gets the scope tree and optionally refreshes Commerce scopes from Commerce API.
 *
 * The scope tree represents the hierarchical structure of configuration scopes available
 * in your Adobe Commerce instance. This includes both system scopes (global, website, store)
 * and custom scopes that may have been defined.
 *
 * @param context - Scope tree context containing namespace, cache timeout, and optional Commerce config.
 * @param options - Options for scope tree retrieval, including whether to fetch fresh data.
 * @returns Promise resolving to scope tree with metadata about data freshness and any fallback information.
 */
export async function getScopeTree(
  context: ScopeTreeContext,
  options: GetScopeTreeOptions = {},
): Promise<GetScopeTreeResult> {
  const { remoteFetch = false } = options;

  if (remoteFetch && hasCommerceConfig(context)) {
    return await buildTreeWithUpdatedCommerceScopes(context);
  }

  // Try cache first
  const cached = await scopeTreeRepository.getCachedScopeTree(
    context.namespace,
  );
  if (cached) {
    return { scopeTree: cached, isCachedData: true };
  }

  // Fallback to persisted data
  const persistedTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );
  await scopeTreeRepository.setCachedScopeTree(
    context.namespace,
    persistedTree,
    context.cacheTimeout,
  );

  return {
    scopeTree: persistedTree,
    isCachedData: true,
  };
}

/**
 * Builds scope tree with updated Commerce data merged with existing scopes.
 *
 * @param context - Scope tree context with Commerce configuration for fetching fresh data.
 * @returns Promise resolving to scope tree result with fresh Commerce data or fallback data.
 */
async function buildTreeWithUpdatedCommerceScopes(
  context: ScopeTreeContext & { commerceConfig: CommerceHttpClientParams },
): Promise<GetScopeTreeResult> {
  try {
    const commerceClient = initializeCommerceClient(context.commerceConfig);
    const updatedCommerceScopeData = await getAllScopeData(commerceClient);

    const existingTree = await scopeTreeRepository.getPersistedScopeTree(
      context.namespace,
    );

    const updatedCommerceScopes = mergeCommerceScopes(
      updatedCommerceScopeData,
      existingTree,
    );

    const finalTree = buildUpdatedScopeTree(
      updatedCommerceScopes,
      existingTree,
    );

    // Persist updates
    await scopeTreeRepository.saveScopeTree(context.namespace, finalTree);
    await scopeTreeRepository.setCachedScopeTree(
      context.namespace,
      finalTree,
      context.cacheTimeout,
    );

    return {
      scopeTree: finalTree,
      isCachedData: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    logger.debug(
      "Failed to fetch fresh Commerce data, using fallback: ",
      error instanceof Error ? error.message : String(error),
    );

    // Try cached data first
    const cachedFlattenedTree = await scopeTreeRepository.getCachedScopeTree(
      context.namespace,
    );
    if (cachedFlattenedTree) {
      return {
        scopeTree: cachedFlattenedTree,
        isCachedData: true,
        fallbackError: errorMessage,
      };
    }

    // Final fallback to persisted data
    const existingTree = await scopeTreeRepository.getPersistedScopeTree(
      context.namespace,
    );
    await scopeTreeRepository.setCachedScopeTree(
      context.namespace,
      existingTree,
      context.cacheTimeout,
    );

    return {
      scopeTree: existingTree,
      isCachedData: true,
      fallbackError: errorMessage,
    };
  }
}

/**
 * Initializes a Commerce HTTP client from the provided configuration.
 *
 * @param commerceConfig - Commerce HTTP client configuration parameters.
 * @returns Initialized Commerce HTTP client instance.
 *
 * @throws {Error} If the client initialization fails.
 */
function initializeCommerceClient(
  commerceConfig: CommerceHttpClientParams,
): AdobeCommerceHttpClient {
  try {
    return new AdobeCommerceHttpClient(commerceConfig);
  } catch (error) {
    throw new Error(`Failed to initialize Commerce client: ${error}`);
  }
}
