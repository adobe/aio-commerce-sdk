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

import type {
  ChangelogEntry,
  ExecInterface,
  PublishedPackage,
} from "./types.ts";

const SCOPE_RE = /^@adobe\//;

/**
 * Finds the most recent stable release tag for a package that precedes `newTag`.
 * Returns `undefined` if no prior stable tag exists.
 */
export async function resolvePrevTag(
  exec: ExecInterface,
  pkgName: string,
  newTag: string,
): Promise<string | undefined> {
  const { stdout, exitCode } = await exec.getExecOutput(
    "git",
    [
      "describe",
      "--tags",
      "--abbrev=0",
      `${newTag}^`,
      `--match=${pkgName}@*`,
      `--exclude=${pkgName}@*-*`,
    ],
    { ignoreReturnCode: true, silent: true },
  );

  if (exitCode !== 0 || !stdout.trim()) {
    return;
  }

  return stdout.trim();
}

/**
 * Fetches the full diff of a package directory between two git refs.
 */
export async function fetchPackageDiff(
  exec: ExecInterface,
  pkgPath: string,
  newTag: string,
  prevTag: string,
): Promise<string> {
  const { stdout } = await exec.getExecOutput(
    "git",
    [
      "diff",
      `${prevTag}..${newTag}`,
      "--",
      `${pkgPath}/source`,
      `${pkgPath}/docs`,
      `${pkgPath}/BREAKING.md`,
      `${pkgPath}/CHANGELOG.md`,
      `${pkgPath}/package.json`,
      `${pkgPath}/README.md`,
      ":(exclude)**/api-reference/**",
    ],
    { silent: true },
  );
  return stdout;
}

/**
 * Derives the repo-relative package directory from an npm package name.
 * Works for all public packages in this monorepo (`@adobe/aio-commerce-*`).
 */
export function resolvePackagePath(pkgName: string): string {
  return `packages/${pkgName.replace(SCOPE_RE, "")}`;
}

/**
 * Collects full package diffs for all published packages in parallel.
 */
export function collectEntries(
  exec: ExecInterface,
  publishedPackages: PublishedPackage[],
): Promise<ChangelogEntry[]> {
  return Promise.all(
    publishedPackages.map(async (pkg) => {
      const newTag = `${pkg.name}@${pkg.version}`;
      const pkgPath = resolvePackagePath(pkg.name);
      const prevTag = await resolvePrevTag(exec, pkg.name, newTag);

      if (!prevTag) {
        throw new Error(
          `No previous release tag found for ${pkg.name}@${pkg.version}`,
        );
      }

      const diff = await fetchPackageDiff(exec, pkgPath, newTag, prevTag);

      if (!diff.trim()) {
        throw new Error(`No changes found for ${pkg.name}@${pkg.version}`);
      }

      return {
        package: pkg.name,
        version: pkg.version,
        markdown: diff,
        prevTag,
        newTag,
      } satisfies ChangelogEntry;
    }),
  );
}
