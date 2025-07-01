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

import { getIntegrationAuthProvider, HttpMethodInput, IntegrationAuthParamsInput } from './integrationAuth';

describe('getIntegrationAuthProvider', () => {
  const params: IntegrationAuthParamsInput = {
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: 'test-consumer-key',
    AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: 'test-consumer-secret',
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: 'test-access-token',
    AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: 'test-access-token-secret',
  };

  test.each([
    ['localhost'],
    ['http:://'],
    ['https://'],
    ['//example.com'],
    ['http://user@:80'],
  ])('should throw an Error on invalid [%s] URL', (url) => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    expect(() => {
      integrationProvider!.getHeaders('GET', url);
    }).toThrowError('Failed to validate the provided commerce URL. See the console for more details.');
  });

  test.each([
    ['GET'],
    ['POST'],
    ['PUT'],
    ['PATCH'],
    ['DELETE'],
    ['GET'],
  ])('should not throw error on valid [%s] HttpMethodInput', (httpMethod) => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    expect(() => {
      integrationProvider!.getHeaders((httpMethod as HttpMethodInput), 'http://localhost');
    }).not.toThrowError();
  });

  test.each([
    ['http://localhost'],
    ['https://example.com/api'],
    [new URL('http://localhost')],
  ])('should not throw error on valid [%s] URL', (url) => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    expect(() => {
      integrationProvider!.getHeaders('GET', url);
    }).not.toThrowError();
  });


  test('should export getIntegrationAccessToken', () => {
    const integrationProvider = getIntegrationAuthProvider(params);
    expect(integrationProvider).toBeDefined();

    const headers = integrationProvider!.getHeaders('GET', 'http://localhost/test');
    expect(headers).toHaveProperty(
      'Authorization',
      expect.stringMatching(
        /^OAuth oauth_consumer_key="test-consumer-key", oauth_nonce="[^"]+", oauth_signature="[^"]+", oauth_signature_method="HMAC-SHA256", oauth_timestamp="[^"]+", oauth_token="test-access-token", oauth_version="1\.0"$/
      )
    );
  });

  test.each([
    ['AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY'],
    ['AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET'],
    ['AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN'],
    ['AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET'],
  ])(`should return undefined when %s is missing`, (param) => {
    const incompleteParams = {
      ...params,
      [param]: undefined,
    } as Record<string, string>;

    expect(() => {
      getIntegrationAuthProvider(incompleteParams)
    }).toThrowError('Failed to validate the provided integration parameters. See the console for more details.');
  });

  test('should return undefined when no params are provided', () => {
    expect(() => {
      getIntegrationAuthProvider({} as IntegrationAuthParamsInput);
    }).toThrowError('Failed to validate the provided integration parameters. See the console for more details.');
  });
});
