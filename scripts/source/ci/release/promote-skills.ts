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

import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { readJson, runGitHubScript, writeJson } from "./utils.ts";

import type { AsyncFunctionArguments } from "./types.ts";

const SOURCE_REPOSITORY = "adobe/aio-commerce-sdk";
const TARGET_OWNER = "adobe";
const TARGET_REPO = "skills";
const TARGET_REPOSITORY_URL = `https://github.com/${TARGET_OWNER}/${TARGET_REPO}`;
const PROMOTION_BRANCH = "promote/adobe-aio-commerce-sdk";
const PROMOTED_REPOSITORY_FIELD = "https://github.com/adobe/aio-commerce-sdk";
const PROMOTED_ENTRIES = ["tile.json", "README.md", "skills", ".claude-plugin"];

type PluginPackageJson = {
  name: string;
  version: string;
};

type TileJson = {
  name: string;
  version: string;
};

type PluginPromotion = {
  packagePath: string;
  sourcePath: string;
  targetPath: string;
  packageName: string;
  displayName: string;
  version: string;
  changelogEntries: string[];
};

type PromotionOptions = {
  sourceRepositoryPath: string;
  skillsRepositoryPath: string;
};

type PullRequestBodySection = {
  displayName: string;
  version: string;
  changelogEntries: string[];
};

export default async function main(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  github: AsyncFunctionArguments["github"],
  context: AsyncFunctionArguments["context"],
) {
  return await runGitHubScript(core, async () => {
    await promoteSkills(core, exec, github, context, {
      skillsRepositoryPath: requireEnv("SKILLS_REPOSITORY_PATH"),
      sourceRepositoryPath: requireEnv("SOURCE_REPOSITORY_PATH"),
    });
  });
}

export async function promoteSkills(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  github: AsyncFunctionArguments["github"],
  context: AsyncFunctionArguments["context"],
  options: PromotionOptions,
) {
  const packagePaths = await getChangedPluginPackagePaths(
    exec,
    options.sourceRepositoryPath,
  );

  if (!hasChangedCommercePluginVersions(packagePaths)) {
    core.info("No changed Commerce plugin package versions found.");
    core.setOutput("promotedSkills", "false");
    return;
  }

  await checkoutPromotionBranch(exec, options.skillsRepositoryPath);

  const promotions = await preparePromotionArtifacts(
    packagePaths,
    options.sourceRepositoryPath,
    options.skillsRepositoryPath,
  );

  const committed = await commitAndPushPromotion(
    exec,
    options.skillsRepositoryPath,
    context.sha,
  );

  if (!committed) {
    core.info(
      "adobe/skills already reflects the promoted content. No changes to push.",
    );
    core.setOutput("promotedSkills", "false");
    return;
  }

  await upsertPromotionPullRequest(github, context.sha, promotions);

  core.setOutput("promotedSkills", "true");
  core.info(
    `Promoted ${promotions.length} Commerce plugin(s): ${promotions
      .map((promotion) => `${promotion.displayName}@${promotion.version}`)
      .join(", ")}`,
  );
}

export async function getChangedPluginPackagePaths(
  exec: AsyncFunctionArguments["exec"],
  sourceRepositoryPath: string,
) {
  const diff = await exec.getExecOutput(
    "git",
    [
      "-C",
      sourceRepositoryPath,
      "diff",
      "--name-only",
      "HEAD^1",
      "HEAD",
      "--",
      "plugins/commerce/*/package.json",
    ],
    { silent: true },
  );

  const packagePaths = diff.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const versionChanges = await Promise.all(
    packagePaths.map((packagePath) =>
      packageVersionChanged(exec, sourceRepositoryPath, packagePath),
    ),
  );

  return packagePaths.filter((_, index) => versionChanges[index]);
}

export function hasChangedCommercePluginVersions(packagePaths: string[]) {
  return packagePaths.length > 0;
}

export async function detectChangedCommercePluginVersions(
  core: AsyncFunctionArguments["core"],
  exec: AsyncFunctionArguments["exec"],
  sourceRepositoryPath: string,
) {
  const packagePaths = await getChangedPluginPackagePaths(
    exec,
    sourceRepositoryPath,
  );
  const changed = hasChangedCommercePluginVersions(packagePaths);

  core.setOutput("changed", changed ? "true" : "false");
  core.info(
    changed
      ? `Changed Commerce plugin package versions found: ${packagePaths.join(", ")}`
      : "No changed Commerce plugin package versions found.",
  );

  return changed;
}

export async function preparePromotionArtifacts(
  packagePaths: string[],
  sourceRepositoryPath: string,
  skillsRepositoryPath: string,
) {
  return await Promise.all(
    packagePaths.map(async (packagePath) => {
      const pluginRelativePath = dirname(packagePath);
      const sourcePath = join(sourceRepositoryPath, pluginRelativePath);
      const targetPath = join(skillsRepositoryPath, pluginRelativePath);
      const packageJson = await readJson<PluginPackageJson>(
        join(sourcePath, "package.json"),
      );
      const tileJson = await readJson<TileJson>(join(sourcePath, "tile.json"));
      const displayName =
        tileJson.name.split("/").at(-1) ?? basename(sourcePath);

      await rm(targetPath, { force: true, recursive: true });
      await mkdir(targetPath, { recursive: true });

      await Promise.all(
        PROMOTED_ENTRIES.map((entry) =>
          cp(join(sourcePath, entry), join(targetPath, entry), {
            recursive: true,
          }),
        ),
      );
      await rewritePluginRepository(targetPath);

      return {
        changelogEntries: await readChangelogEntries(
          join(sourcePath, "CHANGELOG.md"),
          packageJson.version,
        ),
        displayName,
        packageName: packageJson.name,
        packagePath,
        sourcePath,
        targetPath,
        version: packageJson.version,
      } satisfies PluginPromotion;
    }),
  );
}

export function buildPromotionPullRequestBody(
  sections: PullRequestBodySection[],
) {
  return sections
    .map((section) => {
      const entries =
        section.changelogEntries.length > 0
          ? section.changelogEntries
          : [`- Promote ${section.displayName} v${section.version}.`];

      return [
        `## ${section.displayName} v${section.version}`,
        "",
        ...entries,
      ].join("\n");
    })
    .join("\n\n");
}

async function packageVersionChanged(
  exec: AsyncFunctionArguments["exec"],
  sourceRepositoryPath: string,
  packagePath: string,
) {
  const currentPackageJson = await readJson<PluginPackageJson>(
    join(sourceRepositoryPath, packagePath),
  );
  const previousPackageJson = await readPreviousPackageJson(
    exec,
    sourceRepositoryPath,
    packagePath,
  );

  return previousPackageJson?.version !== currentPackageJson.version;
}

async function readPreviousPackageJson(
  exec: AsyncFunctionArguments["exec"],
  sourceRepositoryPath: string,
  packagePath: string,
) {
  const result = await exec.getExecOutput(
    "git",
    ["-C", sourceRepositoryPath, "show", `HEAD^1:${packagePath}`],
    { ignoreReturnCode: true, silent: true },
  );

  if (result.exitCode !== 0) {
    return;
  }

  return JSON.parse(result.stdout) as PluginPackageJson;
}

async function rewritePluginRepository(targetPath: string) {
  const pluginJsonPath = join(targetPath, ".claude-plugin/plugin.json");
  const pluginJson = await readJson<Record<string, unknown>>(pluginJsonPath);

  if (pluginJson.repository !== PROMOTED_REPOSITORY_FIELD) {
    throw new Error(
      `Expected ${pluginJsonPath} repository to be ${PROMOTED_REPOSITORY_FIELD}.`,
    );
  }

  pluginJson.repository = TARGET_REPOSITORY_URL;
  await writeJson(pluginJsonPath, pluginJson);
}

// @changesets/release-utils ships an equivalent getChangelogEntry, but it's
// only published as a 1.0.0-next prerelease (part of the unreleased v3 line)
// so we hand-roll this until it reaches a stable release.
async function readChangelogEntries(changelogPath: string, version: string) {
  try {
    const changelog = await readFile(changelogPath, "utf-8");
    const lines = changelog.split("\n");
    const sectionStart = lines.indexOf(`## ${version}`);

    if (sectionStart === -1) {
      return [];
    }

    const remainingLines = lines.slice(sectionStart + 1);
    const nextSection = remainingLines.findIndex((line) =>
      line.startsWith("## "),
    );
    const sectionLines =
      nextSection === -1
        ? remainingLines
        : remainingLines.slice(0, nextSection);

    return sectionLines
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function checkoutPromotionBranch(
  exec: AsyncFunctionArguments["exec"],
  skillsRepositoryPath: string,
) {
  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "config",
    "user.email",
    "github-actions[bot]@users.noreply.github.com",
  ]);
  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "config",
    "user.name",
    "github-actions[bot]",
  ]);
  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "fetch",
    "origin",
    "main",
  ]);
  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "checkout",
    "-B",
    PROMOTION_BRANCH,
    "origin/main",
  ]);
}

async function commitAndPushPromotion(
  exec: AsyncFunctionArguments["exec"],
  skillsRepositoryPath: string,
  sourceSha: string,
): Promise<boolean> {
  await exec.exec("git", ["-C", skillsRepositoryPath, "add", "."]);

  const status = await exec.getExecOutput(
    "git",
    ["-C", skillsRepositoryPath, "status", "--porcelain"],
    { silent: true },
  );

  if (status.stdout.trim().length === 0) {
    return false;
  }

  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "commit",
    "-m",
    `feat(commerce): promote plugins from ${SOURCE_REPOSITORY}@${shortSha(
      sourceSha,
    )}`,
  ]);
  await exec.exec("git", [
    "-C",
    skillsRepositoryPath,
    "push",
    "--force",
    "origin",
    `HEAD:${PROMOTION_BRANCH}`,
  ]);

  return true;
}

async function upsertPromotionPullRequest(
  github: AsyncFunctionArguments["github"],
  sourceSha: string,
  promotions: PluginPromotion[],
) {
  const title = `feat(commerce): promote plugins from ${SOURCE_REPOSITORY}@${shortSha(
    sourceSha,
  )}`;
  const body = buildPromotionPullRequestBody(promotions);
  const openPullRequests = await github.rest.pulls.list({
    head: `${TARGET_OWNER}:${PROMOTION_BRANCH}`,
    owner: TARGET_OWNER,
    repo: TARGET_REPO,
    state: "open",
  });
  const [pullRequest] = openPullRequests.data;

  if (pullRequest) {
    await github.rest.pulls.update({
      body,
      owner: TARGET_OWNER,
      pull_number: pullRequest.number,
      repo: TARGET_REPO,
      title,
    });
    return;
  }

  await github.rest.pulls.create({
    base: "main",
    body,
    head: PROMOTION_BRANCH,
    owner: TARGET_OWNER,
    repo: TARGET_REPO,
    title,
  });
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function shortSha(sha: string) {
  return sha.slice(0, 7);
}
