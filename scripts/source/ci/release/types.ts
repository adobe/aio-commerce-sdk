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

/** The channel of the release. */
export type ReleaseChannel = "internal" | "public";

/** Environment variables for the release prepare script. */
export type Environment = {
  REGISTRY_AUTH_TOKEN: string;
  REGISTRY_URL: string;
  RELEASE_CHANNEL: ReleaseChannel;
};

/** Environment variables for the release announcement script. */
export type AnnounceEnvironment = {
  PUBLISHED_PACKAGES: string;
  REGISTRY_PACKAGE_BASE_URL: string;
  RELEASE_CHANNEL: ReleaseChannel;
};

/** A package published as part of a release. */
export type PublishedPackage = {
  name: string;
  version: string;
};

/** Slack payload for release announcement messages. */
export type SlackPayload = {
  blocks: Array<{
    type: string;
    text: {
      type: string;
      text: string;
    };
  }>;
};

/**
 * Type definitions for GitHub Actions script context.
 *
 * These types match the arguments injected by `actions/github-script`.
 * @see https://github.com/actions/github-script
 */
export interface AsyncFunctionArguments {
  context: typeof import("@actions/github").context;
  core: typeof import("@actions/core");
  exec: typeof import("@actions/exec");
  github: ReturnType<typeof import("@actions/github").getOctokit>;
}
