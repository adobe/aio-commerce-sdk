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
import crypto from 'crypto';
import OAuth1a from 'oauth-1.0a';
import { allNonEmpty } from './params';

export type IntegrationAuthParam =
  | 'COMMERCE_CONSUMER_KEY'
  | 'COMMERCE_CONSUMER_SECRET'
  | 'COMMERCE_ACCESS_TOKEN'
  | 'COMMERCE_ACCESS_TOKEN_SECRET';

export type IntegrationAuthParams = Partial<Record<IntegrationAuthParam, string>>;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type IntegrationAuthHeader = 'Authorization';
export type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

export interface IntegrationAuthProvider {
  getHeaders: (method: HttpMethod, url: string) => IntegrationAuthHeaders;
}

/**
 * If the required integration parameters are present, this function returns an IntegrationAuthProvider.
 * @param {IntegrationAuthParams} params includes integration parameters
 * @returns {IntegrationAuthProvider} returns the integration auth provider
 */
export function getIntegrationAuthProvider(params: IntegrationAuthParams): IntegrationAuthProvider | undefined {
  const config = resolveIntegrationConfig(params);
  if (config) {
    const oauth = new OAuth1a({
      consumer: {
        key: params.COMMERCE_CONSUMER_KEY!,
        secret: params.COMMERCE_CONSUMER_SECRET!,
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (baseString, key) => crypto.createHmac('sha256', key).update(baseString).digest('base64'),
    });

    const oauthToken = {
      key: params.COMMERCE_ACCESS_TOKEN!,
      secret: params.COMMERCE_ACCESS_TOKEN_SECRET!,
    };

    return {
      getHeaders(method: HttpMethod, url: string) {
        return oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
      },
    };
  }
}

function resolveIntegrationConfig(params: IntegrationAuthParams) {
  if (
    allNonEmpty(params, [
      'COMMERCE_CONSUMER_KEY',
      'COMMERCE_CONSUMER_SECRET',
      'COMMERCE_ACCESS_TOKEN',
      'COMMERCE_ACCESS_TOKEN_SECRET',
    ])
  ) {
    return {
      consumerKey: params.COMMERCE_CONSUMER_KEY,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET,
      accessToken: params.COMMERCE_ACCESS_TOKEN,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET,
    };
  }
}
