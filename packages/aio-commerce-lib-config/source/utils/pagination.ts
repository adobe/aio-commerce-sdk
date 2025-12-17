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

/**
 * Pagination utilities following Adobe I/O State best practices.
 *
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */

/**
 * Pagination metadata.
 */
export type PaginationMetadata = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

/**
 * Page-based pagination metadata (alternative to offset-based).
 */
export type PageBasedPagination = {
  total: number;
  currentPage: number;
  lastPage: number;
  itemsPerPage: number;
};

/**
 * Finds a specific page from a collection using offset-based pagination.
 *
 * This follows the Adobe recommended pattern for lib-state pagination.
 *
 * @param collection - Full collection of items.
 * @param limit - Number of items per page.
 * @param offset - Starting offset.
 * @returns Subset of collection for the requested page.
 */
export function findPage<T>(
  collection: T[],
  limit: number,
  offset: number,
): T[] {
  const total = collection.length;
  const endSlice = Math.min(offset + limit, total);

  return collection.slice(offset, endSlice);
}

/**
 * Finds a specific page using 1-based page numbers.
 *
 * @param collection - Full collection of items.
 * @param total - Total number of items.
 * @param currentPage - Current page number (1-based).
 * @param itemsPerPage - Items per page.
 * @returns Subset of collection for the requested page.
 */
export function findPageByNumber<T>(
  collection: T[],
  total: number,
  currentPage: number,
  itemsPerPage: number,
): T[] {
  const fromSlice = (currentPage - 1) * itemsPerPage;
  let toSlice = fromSlice + itemsPerPage;

  if (toSlice > total) {
    toSlice = total;
  }

  return collection.slice(fromSlice, toSlice);
}

/**
 * Creates pagination metadata from offset-based parameters.
 *
 * @param total - Total number of items.
 * @param limit - Items per page.
 * @param offset - Current offset.
 * @returns Pagination metadata.
 */
export function createPaginationMetadata(
  total: number,
  limit: number,
  offset: number,
): PaginationMetadata {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Creates page-based pagination metadata.
 *
 * @param total - Total number of items.
 * @param currentPage - Current page (1-based).
 * @param itemsPerPage - Items per page.
 * @returns Page-based pagination metadata.
 */
export function createPageBasedMetadata(
  total: number,
  currentPage: number,
  itemsPerPage: number,
): PageBasedPagination {
  return {
    total,
    currentPage,
    lastPage: Math.ceil(total / itemsPerPage),
    itemsPerPage,
  };
}

/**
 * Fetches entities from storage using an index-based approach.
 *
 * This implements the Adobe recommended pattern for lib-state:
 * 1. Maintain an index (array of IDs)
 * 2. Paginate the index
 * 3. Fetch individual entities by ID in parallel
 *
 * @param ids - Array of entity IDs from index.
 * @param fetchById - Function to fetch a single entity by ID.
 * @param limit - Number of items per page.
 * @param offset - Starting offset.
 * @returns Paginated collection with metadata.
 * @see https://developer.adobe.com/commerce/extensibility/app-development/best-practices/database-storage/
 */
export async function fetchPaginatedEntities<T>(
  ids: string[],
  fetchById: (id: string) => Promise<T | null>,
  limit: number,
  offset: number,
): Promise<{
  items: T[];
  pagination: PaginationMetadata;
}> {
  const total = ids.length;
  const paginatedIds = findPage(ids, limit, offset);

  const fetchPromises = paginatedIds.map((id) => fetchById(id));
  const results = await Promise.all(fetchPromises);

  const validItems: T[] = [];
  for (const item of results) {
    if (item !== null) {
      validItems.push(item);
    }
  }

  return {
    items: validItems,
    pagination: createPaginationMetadata(total, limit, offset),
  };
}
