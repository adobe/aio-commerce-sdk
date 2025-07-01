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
import * as v from 'valibot';
import { prettyPrintIssues } from './utils';

export type IntegrationAuthParam =
  | 'AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY'
  | 'AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET'
  | 'AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN'
  | 'AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET';

export type IntegrationAuthParams = Partial<Record<IntegrationAuthParam, string>>;

/**
 * The HTTP methods supported by Commerce.
 * This is used to determine which headers to include in the signing of the authorization header.
 */
const AllowedHttpMethod = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const HttpMethodSchema = v.picklist(AllowedHttpMethod);
export type HttpMethodInput = v.InferInput<typeof HttpMethodSchema>;

const BaseUrlSchema = v.pipe(
  v.string(),
  v.nonEmpty('Missing commerce endpoint'),
  v.url('The url is badly formatted.'),
  v.title('Username'),
  v.description(
    'A username must be between 4 and 16 characters long and can only contain letters, numbers, underscores and hyphens.'
  )
);

const UrlSchema = v.union([BaseUrlSchema, v.instance(URL)])
export type UriInput = v.InferInput<typeof UrlSchema>;

export type IntegrationAuthHeader = 'Authorization';
export type IntegrationAuthHeaders = Record<IntegrationAuthHeader, string>;

export interface IntegrationAuthProvider {
  getHeaders: (method: HttpMethodInput, url: UriInput) => IntegrationAuthHeaders;
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
        key: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY!,
        secret: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET!,
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (baseString, key) => crypto.createHmac('sha256', key).update(baseString).digest('base64'),
    });

    const oauthToken = {
      key: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN!,
      secret: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET!,
    };

    return {
      getHeaders(method: HttpMethodInput, url: UriInput) {
        const validation = v.safeParse(UrlSchema, url);
        if (!validation.success) {
          const issues = prettyPrintIssues(validation.issues);
          console.error(`Failed to validate the provided commerce URL: \n ${issues}`)
          throw new Error('Failed to validate the provided commerce URL. See the console for more details.');
        }

        let finalUrl: string;
        if (url instanceof URL) {
          finalUrl = url.toString();
        } else {
          finalUrl = url;
        }

        return oauth.toHeader(oauth.authorize({ url: finalUrl, method }, oauthToken));
      },
    };
  }
}

function resolveIntegrationConfig(params: IntegrationAuthParams) {
  if (
    allNonEmpty(params, [
      'AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY',
      'AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET',
      'AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN',
      'AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET',
    ])
  ) {
    return {
      consumerKey: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY,
      consumerSecret: params.AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET,
      accessToken: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN,
      accessTokenSecret: params.AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET,
    };
  }
}
