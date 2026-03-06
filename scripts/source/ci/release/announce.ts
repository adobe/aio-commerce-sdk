/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { parseReleaseChannel, runGitHubScript } from "./utils";

import type { AsyncFunctionArguments } from "github-script";
import type {
  AnnounceEnvironment,
  PublishedPackage,
  ReleaseChannel,
  SlackPayload,
} from "./types";

const REPOSITORY = "adobe/aio-commerce-sdk";
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;

export default function main(core: AsyncFunctionArguments["core"]) {
  return runGitHubScript(core, () => {
    const webhookBody = announce();
    core.setOutput("SLACK_WEBHOOK_PAYLOAD", JSON.stringify(webhookBody));

    return webhookBody;
  });
}

/** Entrypoint of the script. */
function announce(): SlackPayload {
  const { publishedPackages, channelArg, packageBaseUrl } = readInputs();
  const announcement = formatMarkdownAnnouncement(
    publishedPackages,
    channelArg,
    packageBaseUrl,
  );

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: announcement,
        },
      },
    ],
  };
}

/** Reads the inputs from the environment variables. */
function readInputs() {
  const {
    PUBLISHED_PACKAGES: publishedPackagesJson,
    REGISTRY_PACKAGE_BASE_URL: packageBaseUrl,
    RELEASE_CHANNEL: channelArgValue,
  } = process.env as AnnounceEnvironment;

  if (!publishedPackagesJson) {
    throw new Error(
      "Missing required PUBLISHED_PACKAGES environment variable.",
    );
  }

  if (!packageBaseUrl) {
    throw new Error(
      "Missing required REGISTRY_PACKAGE_BASE_URL environment variable.",
    );
  }

  const publishedPackages = JSON.parse(
    publishedPackagesJson,
  ) as PublishedPackage[];

  return {
    channelArg: parseReleaseChannel(channelArgValue),
    packageBaseUrl,
    publishedPackages,
  };
}

/** Joins the base URL and the package name to form the package URL. */
function joinPackageUrl(baseUrl: string, packageName: string): string {
  const parsedBaseUrl = new URL(baseUrl);
  const normalizedPath = parsedBaseUrl.pathname.endsWith("/")
    ? parsedBaseUrl.pathname
    : `${parsedBaseUrl.pathname}/`;

  parsedBaseUrl.pathname = `${normalizedPath}${packageName}`;
  return parsedBaseUrl.toString();
}

/**
 * Formats an announcement for Slack based on the published packages.
 * @see https://api.slack.com/reference/surfaces/formatting#basic-formatting
 *
 * @param publishedPackages - The published packages.
 * @returns The announcement text markdown format
 */
function formatMarkdownAnnouncement(
  publishedPackages: PublishedPackage[],
  channel: ReleaseChannel,
  packageBaseUrl: string,
): string {
  // Sort packages to ensure consistent order
  publishedPackages.sort((a, b) => {
    const aRank = a.name === "@adobe/aio-commerce-sdk" ? 0 : 1;
    const bRank = b.name === "@adobe/aio-commerce-sdk" ? 0 : 1;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.name.localeCompare(b.name);
  });

  const channelLabel =
    channel === "internal" ? "internal (Artifactory)" : "public (npm)";

  let announcement = `:rocket: New ${channelLabel} packages for <${REPOSITORY_URL}|Adobe Commerce SDK for App Builder>\n\n`;

  for (const pkg of publishedPackages) {
    const pkgRelease = `${pkg.name}@${pkg.version}`;
    const pkgReleaseUrl = `${REPOSITORY_URL}/releases/tag/${pkgRelease}`;
    const packageUrl = joinPackageUrl(packageBaseUrl, pkg.name);

    announcement += `\u2007• \`${pkgRelease}\`: Read the <${pkgReleaseUrl}|release notes⇗>. See package <${packageUrl}|details⇗>.\n`;
  }

  return announcement.trimEnd();
}
