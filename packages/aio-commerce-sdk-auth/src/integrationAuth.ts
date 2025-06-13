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

export interface IntegrationAuthParams {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IntegrationAuthHeaders {
  Authorization: string;
}

export interface IntegrationAccessToken {
  headers: (url: string, method: HttpMethod) => IntegrationAuthHeaders;
}

/**
 * Generate access token to connect with Adobe Commerce using Commerce Integrations which is based on OAuth 1.0a.
 * @param {object} params includes integration parameters
 * @returns {IntegrationAccessToken} returns the access token headers
 */
export function getIntegrationAccessToken({
  consumerKey,
  consumerSecret,
  accessToken,
  accessTokenSecret,
}: IntegrationAuthParams): IntegrationAccessToken {
  const oauth = new OAuth1a({
    consumer: {
      key: consumerKey,
      secret: consumerSecret,
    },
    signature_method: 'HMAC-SHA256',
    hash_function: (baseString, key) => crypto.createHmac('sha256', key).update(baseString).digest('base64'),
  });

  const oauthToken = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  return {
    headers(url: string, method: HttpMethod) {
      return oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
    },
  };
}
