import type { Options } from "@adobe/aio-commerce-lib-api/ky";
import type { createAdobeIoApiClient } from "#io-console/index";

type AdobeIoApiClient = ReturnType<typeof createAdobeIoApiClient>;

const ORG_ID = "org-1";
const PROJECT_ID = "project-id";
const WORKSPACE_ID = "workspace-id";

export const ADOBE_IO_CONSOLE_API_PAYLOADS = [
  {
    name: "downloadWorkspaceJson",
    method: "GET",
    pathname: `console/organizations/${ORG_ID}/projects/${PROJECT_ID}/workspaces/${WORKSPACE_ID}/download`,

    invoke(client: AdobeIoApiClient, fetchOptions?: Options) {
      return client.downloadWorkspaceJson(
        { orgId: ORG_ID, projectId: PROJECT_ID, workspaceId: WORKSPACE_ID },
        fetchOptions,
      );
    },

    hasInputValidation: true,
    hasCamelCaseTransformer: false,
  },
];
