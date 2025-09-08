import { describe, expect, test } from "vitest";

import {
  createCommerceEventsApiClient,
  createCustomCommerceEventsApiClient,
  createEventProvider,
  getAllEventProviders,
} from "#commerce/index";
import { TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS } from "#test/fixtures/http-clients";

describe("Commerce Events API", () => {
  describe("createCommerceEventsApiClient", () => {
    test("should create an API client with all commerce events endpoints", () => {
      const client = createCommerceEventsApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS,
      );

      // Verify all expected methods are present
      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("getEventProviderById");
      expect(client).toHaveProperty("createEventProvider");
      expect(client).toHaveProperty("getAllEventSubscriptions");
      expect(client).toHaveProperty("createEventSubscription");
      expect(client).toHaveProperty("updateEventingConfiguration");
    });
  });

  describe("createCustomCommerceEventsApiClient", () => {
    test("should create an API client with only specified endpoints", () => {
      const customFunctions = {
        getAllEventProviders,
        createEventProvider,
      };

      const client = createCustomCommerceEventsApiClient(
        TEST_ADOBE_COMMERCE_HTTP_CLIENT_PARAMS,
        customFunctions,
      );

      expect(client).toHaveProperty("getAllEventProviders");
      expect(client).toHaveProperty("createEventProvider");

      expect(client).not.toHaveProperty("getAllEventSubscriptions");
      expect(client).not.toHaveProperty("updateEventingConfiguration");
    });
  });

  // These tests shall verify that the API calls are made correctly as per the API documentation
  // See: https://developer.adobe.com/commerce/extensibility/events/api/
  /* describe("event providers endpoints", () => {
    const context = setupCommerceEventsTestContext();

    describe("getAllEventProviders", () => {
      test("should make a GET request to the correct endpoint", async () => {
        const { testClient, fetchMock } = context;
        await getAllEventProviders(testClient);

        expect(fetchMock).toHaveBeenCalledWith(
          "eventing/eventProvider",
          expect.any(Request)
        );
      });

      test("should pass fetch options if provided", async () => {
        const fetchOptions = { headers: { "X-Custom": "test" } };
        const { testClient, fetchMock } = context;

        await getAllEventProviders(testClient, fetchOptions);
        expect(fetchMock).toHaveBeenCalledWith(
          "eventing/eventProvider",
          expect.objectContaining({
            headers: { "X-Custom": "test" },
          })
        );
      });
    }); */

  /* describe("getEventProviderById", () => {
      test("should make a GET request with the provider ID", async () => {
        await getEventProviderById(mockHttpClient, {
          providerId: "test-provider-123",
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith(
          "eventing/eventProvider/test-provider-123",
          undefined
        );
      });

      test("should throw validation error for invalid params", async () => {
        await expect(
          getEventProviderById(mockHttpClient, {
            // @ts-expect-error - Testing invalid params
            providerId: 123, // Should be string
          })
        ).rejects.toThrow(CommerceSdkValidationError);
      });
    });

    describe("createEventProvider", () => {
      test("should make a POST request with properly formatted data", async () => {
        const params = {
          providerId: "new-provider",
          instanceId: "instance-123",
          label: "Test Provider",
          description: "A test provider",
          associatedWorkspaceConfiguration: { key: "value" },
        };

        await createEventProvider(mockHttpClient, params);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "eventing/eventProvider",
          {
            json: {
              eventProvider: {
                provider_id: "new-provider",
                instance_id: "instance-123",
                label: "Test Provider",
                description: "A test provider",
                workspace_configuration: JSON.stringify({ key: "value" }),
              },
            },
          }
        );
      });

      test("should handle minimal required params", async () => {
        const params = {
          providerId: "minimal-provider",
          instanceId: "instance-456",
        };

        await createEventProvider(mockHttpClient, params);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "eventing/eventProvider",
          {
            json: {
              eventProvider: {
                provider_id: "minimal-provider",
                instance_id: "instance-456",
                label: undefined,
                description: undefined,
                workspace_configuration: undefined,
              },
            },
          }
        );
      });

      test("should throw validation error for missing required params", async () => {
        await expect(
          createEventProvider(mockHttpClient, {
            // @ts-expect-error - Testing missing required field
            providerId: "only-provider-id",
          })
        ).rejects.toThrow(CommerceSdkValidationError);
      });
    }); 
  }); */

  /*  describe("event subscriptions endpoints", () => {
    describe("getAllEventSubscriptions", () => {
      test("should make a GET request to the correct endpoint", async () => {
        await getAllEventSubscriptions(mockHttpClient);

        expect(mockHttpClient.get).toHaveBeenCalledWith(
          "eventing/getEventSubscriptions",
          undefined
        );
      });
    });

    describe("createEventSubscription", () => {
      test("should make a POST request with properly formatted data", async () => {
        const params = {
          name: "com.adobe.commerce.observer.catalog_product_save_after",
          fields: [{ name: "sku" }, { name: "name" }],
          providerId: "provider-123",
          destination: "custom-destination",
          hipaaAuditRequired: true,
          prioritary: true,
          force: true,
        };

        await createEventSubscription(mockHttpClient, params);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "eventing/eventSubscribe",
          {
            json: {
              force: true,
              event: {
                name: "com.adobe.commerce.observer.catalog_product_save_after",
                parent: undefined,
                fields: [{ name: "sku" }, { name: "name" }],
                destination: "custom-destination",
                hipaa_audit_required: true,
                priority: true,
                provider_id: "provider-123",
              },
            },
          }
        );
      });

      test("should handle minimal required params", async () => {
        const params = {
          name: "test.event",
          fields: [],
        };

        await createEventSubscription(mockHttpClient, params);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "eventing/eventSubscribe",
          {
            json: {
              force: undefined,
              event: {
                name: "test.event",
                parent: undefined,
                fields: [],
                destination: undefined,
                hipaa_audit_required: undefined,
                priority: undefined,
                provider_id: undefined,
              },
            },
          }
        );
      });

      test("should throw validation error for invalid fields", async () => {
        await expect(
          createEventSubscription(mockHttpClient, {
            name: "test.event",
            // @ts-expect-error - Testing invalid fields
            fields: "invalid", // Should be array
          })
        ).rejects.toThrow(CommerceSdkValidationError);
      });
    });
  });

  describe("eventing configuration endpoints", () => {
    describe("updateEventingConfiguration", () => {
      test("should make a PUT request with configuration data", async () => {
        const params = {
          enabled: true,
          providerId: "provider-123",
          instanceId: "instance-456",
          merchantId: "merchant_789",
          environmentId: "env_123",
          workspaceConfiguration: { test: "config" },
        };

        await updateEventingConfiguration(mockHttpClient, params);

        expect(mockHttpClient.put).toHaveBeenCalledWith(
          "eventing/updateConfiguration",
          {
            json: {
              config: {
                enabled: true,
                providerId: "provider-123",
                instanceId: "instance-456",
                merchantId: "merchant_789",
                environmentId: "env_123",
                workspaceConfiguration: JSON.stringify({ test: "config" }),
              },
            },
          }
        );
      });

      test("should handle partial configuration updates", async () => {
        const params = {
          enabled: false,
        };

        await updateEventingConfiguration(mockHttpClient, params);

        expect(mockHttpClient.put).toHaveBeenCalledWith(
          "eventing/updateConfiguration",
          {
            json: {
              config: {
                enabled: false,
              },
            },
          }
        );
      });

      test("should validate providerId format", async () => {
        await expect(
          updateEventingConfiguration(mockHttpClient, {
            providerId: "invalid provider!", // Contains invalid characters
          })
        ).rejects.toThrow(CommerceSdkValidationError);
      });

      test("should validate merchantId format", async () => {
        await expect(
          updateEventingConfiguration(mockHttpClient, {
            merchantId: "merchant-123", // Contains hyphen, which is not allowed
          })
        ).rejects.toThrow(CommerceSdkValidationError);
      });
    });
  }); */
});
