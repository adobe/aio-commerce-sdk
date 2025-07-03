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

import { getImsAuthProvider, ImsAuthParamsSchemaInput } from './imsAuth';
import { getToken } from '@adobe/aio-lib-ims';

jest.mock('@adobe/aio-lib-ims', () => ({
  context: jest.requireActual('@adobe/aio-lib-ims').context,
  getToken: jest.fn(),
}));

describe('getImsAuthProvider', () => {
  const params: ImsAuthParamsSchemaInput = {
    AIO_COMMERCE_IMS_CLIENT_ID: 'test-client-id',
    AIO_COMMERCE_IMS_CLIENT_SECRETS: JSON.stringify(['supersecret']),
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: 'test-technical-account-id',
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: 'test-email@example.com',
    AIO_COMMERCE_IMS_IMS_ORG_ID: 'test-org-id',
    AIO_COMMERCE_IMS_SCOPES: JSON.stringify(['scope1', 'scope2']),
    AIO_COMMERCE_IMS_ENV: "stage",
    AIO_COMMERCE_IMS_CTX: 'foo',
  };

  test('should export token when all required params are provided', async () => {
    await expect(getImsAuthProvider({} as ImsAuthParamsSchemaInput)).rejects.toThrow(
      'Failed to validate the provided IMS parameters. See the console for more details.'
    );
  });

  test('should throw an error when invalid params are provided', async () => {
    const authToken = 'supersecrettoken';

    jest.mocked(getToken).mockResolvedValue(authToken);

    const imsProvider = await getImsAuthProvider(params);
    expect(imsProvider).toBeDefined();

    const retrievedToken = await imsProvider!.getAccessToken();
    expect(retrievedToken).toEqual(authToken);

    const headers = await imsProvider!.getHeaders();
    expect(headers).toHaveProperty('Authorization', `Bearer ${authToken}`);
    expect(headers).toHaveProperty('x-api-key', params.AIO_COMMERCE_IMS_CLIENT_ID);
  });

  test.each([
    ['AIO_COMMERCE_IMS_CLIENT_ID'],
    ['AIO_COMMERCE_IMS_CLIENT_SECRETS'],
    ['AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID'],
    ['AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL'],
    ['AIO_COMMERCE_IMS_IMS_ORG_ID'],
    ['AIO_COMMERCE_IMS_SCOPES'],
  ])(`should throw an Error when %s is missing`, async (param) => {
      await expect(getImsAuthProvider({
        ...params,
        [param]: undefined,
      }))
        .rejects
        .toThrow('Failed to validate the provided IMS parameters. See the console for more details.');
    });

  test.each([
    ['[test, foo]', 'AIO_COMMERCE_IMS_SCOPES'],
    ['[{test: "foo"}]', 'AIO_COMMERCE_IMS_SCOPES'],
    ['["test"', 'AIO_COMMERCE_IMS_SCOPES'],
    ['[test, foo]', 'AIO_COMMERCE_IMS_CLIENT_SECRETS'],
    ['[{test: "foo"}]', 'AIO_COMMERCE_IMS_CLIENT_SECRETS'],
    ['["test"', 'AIO_COMMERCE_IMS_CLIENT_SECRETS'],
  ])(`should throw an Error when given %s as %s input"`, async (param, key) => {
    await expect(getImsAuthProvider({
      ...params,
      [key]: param,
    }))
      .rejects
      .toThrow('Failed to validate the provided IMS parameters. See the console for more details.');
  });
});
