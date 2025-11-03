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

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type {
  CommerceScopeData,
  StoreGroup,
  StoreView,
  Website,
} from "../types";

/**
 * Service for fetching scope data from Adobe Commerce REST API
 */
export class CommerceService {
  private readonly httpClient: AdobeCommerceHttpClient;

  public constructor(httpClient: AdobeCommerceHttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Fetch all scope data from Commerce REST API endpoints
   * @returns Complete Commerce scope data with websites, store groups, and store views
   */
  public async getAllScopeData(): Promise<CommerceScopeData> {
    try {
      // Fetch all three endpoint data in parallel for better performance
      const [websites, storeGroups, storeViews] = await Promise.all([
        this.getWebsites(),
        this.getStoreGroups(),
        this.getStoreViews(),
      ]);

      return { websites, storeGroups, storeViews };
    } catch (error) {
      throw new Error(`Failed to fetch Commerce scope data: ${error}`);
    }
  }

  /**
   * Get all websites using /V1/store/websites endpoint
   * @see https://adobe-commerce.redoc.ly/2.4.8-admin/tag/storewebsites
   */
  public async getWebsites(): Promise<Website[]> {
    try {
      return await this.httpClient.get("store/websites").json<Website[]>();
    } catch (error) {
      throw new Error(`Failed to fetch websites: ${error}`);
    }
  }

  /**
   * Get all store groups using /V1/store/storeGroups endpoint
   * @see https://adobe-commerce.redoc.ly/2.4.8-admin/tag/storestoreGroups
   */
  public async getStoreGroups(): Promise<StoreGroup[]> {
    try {
      return await this.httpClient
        .get("store/storeGroups")
        .json<StoreGroup[]>();
    } catch (error) {
      throw new Error(`Failed to fetch store groups: ${error}`);
    }
  }

  /**
   * Get all store views using /V1/store/storeViews endpoint
   * @see https://adobe-commerce.redoc.ly/2.4.8-admin/tag/storestoreViews
   */
  public async getStoreViews(): Promise<StoreView[]> {
    try {
      return await this.httpClient.get("store/storeViews").json<StoreView[]>();
    } catch (error) {
      throw new Error(`Failed to fetch store views: ${error}`);
    }
  }
}
