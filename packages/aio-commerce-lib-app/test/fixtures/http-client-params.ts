// Default config for the test Adobe I/O Events HTTP client.
import type { IoEventsHttpClientParams } from "@adobe/aio-commerce-lib-api";

export const TEST_ADOBE_IO_EVENTS_HTTP_CLIENT_PARAMS: IoEventsHttpClientParams =
  {
    config: {
      baseUrl: "https://api.adobe.io/events",
    },

    auth: {
      clientId: "test-client-id",
      clientSecrets: ["test-client-secret"],
      technicalAccountId: "test-technical-account-id",
      technicalAccountEmail: "test-technical-account-email",
      imsOrgId: "test-ims-org-id",
      environment: "prod",
    },
  };
