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
import { ClientCredentials } from 'simple-oauth2';

export interface ImsAuthParams {
  clientId: string;
  clientSecret: string;
  scopes: Array<string>;
  host?: string;
}

export interface ImsAuthHeaders {
  Authorization: string;
  'x-api-key': string;
}

export interface ImsToken {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
  headers: () => ImsAuthHeaders;
}

/**
 * Generate access token to connect with Adobe tools (e.g. IO Events)
 *
 * @param {object} params includes env parameters
 * @returns {Promise<ImsToken>} returns the access token
 * @throws {Error} in case of any failure
 */
export async function getImsAccessToken({
  clientId,
  clientSecret,
  scopes,
  host = 'https://ims-na1.adobelogin.com',
}: ImsAuthParams): Promise<ImsToken> {
  const client = new ClientCredentials({
    client: {
      id: clientId,
      secret: clientSecret,
    },
    auth: {
      tokenHost: host,
      tokenPath: '/ims/token/v3',
    },
    options: {
      bodyFormat: 'form',
      authorizationMethod: 'body',
    },
  });

  try {
    const {
      token: { access_token: accessToken, refresh_token: refreshToken, token_type: tokenType, expires_in: expiresIn },
    } = await client.getToken({
      scope: scopes,
    });
    return {
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
      headers: () => ({ Authorization: `Bearer ${accessToken}`, 'x-api-key': clientId }),
    };
  } catch (error) {
    throw new Error(`Unable to get access token ${error.message}`);
  }
}
