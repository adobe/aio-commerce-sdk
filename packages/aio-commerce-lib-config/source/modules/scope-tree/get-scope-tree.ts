/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import AioLogger from "@adobe/aio-lib-core-logging";

import { CommerceService } from "../../services/commerce-service";
import { buildUpdatedScopeTree, mergeCommerceScopes } from "./merge-scopes";
import { ScopeTreeRepository } from "./scope-tree-repository";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type {
  GetScopeTreeOptions,
  GetScopeTreeResult,
  ScopeTreeContext,
} from "./types";

const logger = AioLogger("@adobe/aio-commerce-lib-config:get-scope-tree", {
  level: process.env.LOG_LEVEL ?? "debug",
});

/**
 * Get scope tree and optionally refresh commerce scopes from Commerce API
 * @param context - Context containing configuration and namespace
 * @param options - Options for scope tree retrieval
 * @returns Scope tree with metadata about data freshness and any fallback information
 */
export async function getScopeTree(
  context: ScopeTreeContext,
  options: GetScopeTreeOptions = {},
): Promise<GetScopeTreeResult> {
  const { remoteFetch = false } = options;
  const repository = new ScopeTreeRepository();

  if (remoteFetch && context.commerceConfig) {
    return await buildTreeWithUpdatedCommerceScopes(context, repository);
  }

  // Try cache first
  const cached = await repository.getCachedScopeTree(context.namespace);
  if (cached) {
    return { scopeTree: cached, isCachedData: true };
  }

  // Fallback to persisted data
  const persistedTree = await repository.getPersistedScopeTree(
    context.namespace,
  );
  await repository.setCachedScopeTree(
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
 * Build scope tree with updated Commerce data merged with existing scopes
 * Returns scope tree ready for caching and returning to caller
 */
async function buildTreeWithUpdatedCommerceScopes(
  context: ScopeTreeContext,
  repository: ScopeTreeRepository,
): Promise<GetScopeTreeResult> {
  try {
    const commerceClient = initializeCommerceClient(context.commerceConfig!);
    const commerceService = new CommerceService(commerceClient);
    const updatedCommerceScopeData = await commerceService.getAllScopeData();

    const existingTree = await repository.getPersistedScopeTree(
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
    await repository.saveScopeTree(context.namespace, finalTree);
    await repository.setCachedScopeTree(
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
    const cachedFlattenedTree = await repository.getCachedScopeTree(
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
    const existingTree = await repository.getPersistedScopeTree(
      context.namespace,
    );
    await repository.setCachedScopeTree(
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
 * Initialize Commerce HTTP client
 */
function initializeCommerceClient(
  commerceConfig: NonNullable<ScopeTreeContext["commerceConfig"]>,
): AdobeCommerceHttpClient {
  try {
    return new AdobeCommerceHttpClient(
      commerceConfig as CommerceHttpClientParams,
    );
  } catch (error) {
    throw new Error(`Failed to initialize Commerce client: ${error}`);
  }
}
