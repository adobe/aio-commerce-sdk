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

import { getImsAuthProvider, ImsAuthParams } from './imsAuth';
import { getToken } from '@adobe/aio-lib-ims';

jest.mock('@adobe/aio-lib-ims', () => ({
  context: jest.requireActual('@adobe/aio-lib-ims').context,
  getToken: jest.fn(),
}));

describe('getImsAuthProvider', () => {
  const params: ImsAuthParams = {
    OAUTH_CLIENT_ID: 'test-client-id',
    OAUTH_CLIENT_SECRETS: JSON.stringify(['supersecret']),
    OAUTH_TECHNICAL_ACCOUNT_ID: 'test-technical-account-id',
    OAUTH_TECHNICAL_ACCOUNT_EMAIL: 'test-email@example.com',
    OAUTH_IMS_ORG_ID: 'test-org-id',
    OAUTH_SCOPES: JSON.stringify(['scope1', 'scope2']),
  };

  test('should export token when all required params are provided', async () => {
    const authToken = 'supersecrettoken';

    jest.mocked(getToken).mockResolvedValue(authToken);

    const imsProvider = await getImsAuthProvider(params);
    expect(imsProvider).toBeDefined();

    const retrievedToken = await imsProvider!.getAccessToken();
    expect(retrievedToken).toEqual(authToken);

    const headers = await imsProvider!.getHeaders();
    expect(headers).toHaveProperty('Authorization', `Bearer ${authToken}`);
    expect(headers).toHaveProperty('x-api-key', params.OAUTH_CLIENT_ID);
  });

  [
    'OAUTH_CLIENT_ID',
    'OAUTH_CLIENT_SECRETS',
    'OAUTH_TECHNICAL_ACCOUNT_ID',
    'OAUTH_TECHNICAL_ACCOUNT_EMAIL',
    'OAUTH_IMS_ORG_ID',
    'OAUTH_SCOPES',
  ].forEach((param) => {
    test(`should return undefined when ${param} is missing`, async () => {
      const incompleteParams = {
        ...params,
        [param]: undefined,
      };

      const imsProvider = await getImsAuthProvider(incompleteParams);

      expect(imsProvider).toBeUndefined();
    });
  });
});
