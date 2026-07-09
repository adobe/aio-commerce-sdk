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

import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test, vi } from "vitest";

import {
  buildPromotionPullRequestBody,
  detectChangedCommercePluginVersions,
  getChangedPluginPackagePaths,
  hasChangedCommercePluginVersions,
  preparePromotionArtifacts,
  promoteSkills,
} from "#ci/release/promote-skills";
import {
  asCore,
  asExec,
  createCoreMock,
  createExecMock,
} from "#test/fixtures/release";

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("release/promote-skills.ts", () => {
  test("reports whether Commerce plugin package versions changed", async () => {
    await withTempFiles({}, async (tempDir) => {
      const core = createCoreMock();
      const exec = createExecMock();
      exec.getExecOutput.mockResolvedValueOnce({
        exitCode: 0,
        stderr: "",
        stdout: "",
      });

      await expect(
        detectChangedCommercePluginVersions(
          asCore(core),
          asExec(exec),
          tempDir,
        ),
      ).resolves.toBe(false);

      expect(core.setOutput).toHaveBeenCalledWith("changed", "false");
    });
  });

  test("returns true when changed Commerce plugin package versions exist", () => {
    expect(
      hasChangedCommercePluginVersions([
        "plugins/commerce/app-management/package.json",
      ]),
    ).toBe(true);
  });

  test("skips promotion when no plugin package versions changed", async () => {
    await withTempFiles({}, async (tempDir) => {
      const core = createCoreMock();
      const exec = createExecMock();
      const github = {
        rest: {
          pulls: {
            create: vi.fn(),
            list: vi.fn(),
            update: vi.fn(),
          },
        },
      };
      const context = { sha: "1234567890abcdef" };
      exec.getExecOutput.mockResolvedValueOnce({
        exitCode: 0,
        stderr: "",
        stdout: "",
      });

      await promoteSkills(
        asCore(core),
        asExec(exec),
        github as never,
        context as never,
        {
          skillsRepositoryPath: join(tempDir, "skills"),
          sourceRepositoryPath: tempDir,
        },
      );

      expect(core.setOutput).toHaveBeenCalledWith("promotedSkills", "false");
      expect(github.rest.pulls.create).not.toHaveBeenCalled();
    });
  });

  test("returns no changed plugin packages when no package versions changed", async () => {
    await withTempFiles({}, async (tempDir) => {
      const exec = createExecMock();
      exec.getExecOutput.mockResolvedValueOnce({
        exitCode: 0,
        stderr: "",
        stdout: "",
      });

      await expect(
        getChangedPluginPackagePaths(asExec(exec), tempDir),
      ).resolves.toEqual([]);
    });
  });

  test("detects plugin package version changes", async () => {
    await withTempFiles(
      {
        "plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        const exec = createExecMock();
        exec.getExecOutput
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: "plugins/commerce/app-management/package.json\n",
          })
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: JSON.stringify({
              name: "@adobe/aio-commerce-plugin-app-management",
              version: "0.0.0",
            }),
          });

        await expect(
          getChangedPluginPackagePaths(asExec(exec), tempDir),
        ).resolves.toEqual(["plugins/commerce/app-management/package.json"]);
      },
    );
  });

  test("ignores plugin package changes when the version is unchanged", async () => {
    await withTempFiles(
      {
        "plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        const exec = createExecMock();
        exec.getExecOutput
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: "plugins/commerce/app-management/package.json\n",
          })
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: JSON.stringify({
              name: "@adobe/aio-commerce-plugin-app-management",
              version: "1.0.0",
            }),
          });

        await expect(
          getChangedPluginPackagePaths(asExec(exec), tempDir),
        ).resolves.toEqual([]);
      },
    );
  });

  test("detects newly added plugin package versions", async () => {
    await withTempFiles(
      {
        "plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        const exec = createExecMock();
        exec.getExecOutput
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: "plugins/commerce/app-management/package.json\n",
          })
          .mockResolvedValueOnce({
            exitCode: 128,
            stderr: "fatal: path does not exist",
            stdout: "",
          });

        await expect(
          getChangedPluginPackagePaths(asExec(exec), tempDir),
        ).resolves.toEqual(["plugins/commerce/app-management/package.json"]);
      },
    );
  });

  test("copies promotion artifacts and excludes SDK-only files", async () => {
    await withTempFiles(
      {
        "skills/plugins/commerce/app-management/package.json": "{}",
        "source/plugins/commerce/app-management/.claude-plugin/plugin.json":
          JSON.stringify({
            name: "commerce-app-management",
            repository: "https://github.com/adobe/aio-commerce-sdk",
            version: "1.0.0",
          }),
        "source/plugins/commerce/app-management/CHANGELOG.md": [
          "# @adobe/aio-commerce-plugin-app-management",
          "",
          "## 1.1.0",
          "",
          "- Keep future entries out.",
          "",
          "## 1.0.0",
          "",
          "- Promote App Management skills.",
          "",
          "## 0.1.0",
          "",
          "- Keep previous entries out.",
          "",
        ].join("\n"),
        "source/plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.0.0",
        }),
        "source/plugins/commerce/app-management/README.md":
          "# App Management\n",
        "source/plugins/commerce/app-management/skills/commerce-app-init/SKILL.md":
          "# Skill\n",
        "source/plugins/commerce/app-management/tile.json": JSON.stringify({
          name: "adobe/commerce-app-management",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        const sourceRoot = join(tempDir, "source");
        const skillsRoot = join(tempDir, "skills");

        const promotions = await preparePromotionArtifacts(
          ["plugins/commerce/app-management/package.json"],
          sourceRoot,
          skillsRoot,
        );

        const targetRoot = join(skillsRoot, "plugins/commerce/app-management");
        const pluginJson = JSON.parse(
          await readFile(
            join(targetRoot, ".claude-plugin/plugin.json"),
            "utf-8",
          ),
        );

        expect(promotions).toEqual([
          expect.objectContaining({
            changelogEntries: ["- Promote App Management skills."],
            displayName: "commerce-app-management",
            packageName: "@adobe/aio-commerce-plugin-app-management",
            version: "1.0.0",
          }),
        ]);
        expect(pluginJson.repository).toBe("https://github.com/adobe/skills");
        await expect(
          readFile(
            join(targetRoot, "skills/commerce-app-init/SKILL.md"),
            "utf-8",
          ),
        ).resolves.toBe("# Skill\n");
        await expect(
          fileExists(join(targetRoot, "package.json")),
        ).resolves.toBe(false);
        await expect(
          fileExists(join(targetRoot, "CHANGELOG.md")),
        ).resolves.toBe(false);
      },
    );
  });

  test("rejects plugin manifests that do not point to the SDK repository", async () => {
    await withTempFiles(
      {
        "source/plugins/commerce/app-management/.claude-plugin/plugin.json":
          JSON.stringify({
            name: "commerce-app-management",
            repository: "https://github.com/adobe/skills",
            version: "1.0.0",
          }),
        "source/plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.0.0",
        }),
        "source/plugins/commerce/app-management/README.md":
          "# App Management\n",
        "source/plugins/commerce/app-management/skills/commerce-app-init/SKILL.md":
          "# Skill\n",
        "source/plugins/commerce/app-management/tile.json": JSON.stringify({
          name: "adobe/commerce-app-management",
          version: "1.0.0",
        }),
      },
      async (tempDir) => {
        await expect(
          preparePromotionArtifacts(
            ["plugins/commerce/app-management/package.json"],
            join(tempDir, "source"),
            join(tempDir, "skills"),
          ),
        ).rejects.toThrow("repository");
      },
    );
  });

  test("promotes changed plugins through the full git path", async () => {
    await withTempFiles(
      {
        "source/plugins/commerce/app-management/.claude-plugin/plugin.json":
          JSON.stringify({
            name: "commerce-app-management",
            repository: "https://github.com/adobe/aio-commerce-sdk",
            version: "1.2.0",
          }),
        "source/plugins/commerce/app-management/CHANGELOG.md": [
          "# @adobe/aio-commerce-plugin-app-management",
          "",
          "## 1.2.0",
          "",
          "- Add new skill.",
          "",
        ].join("\n"),
        "source/plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.2.0",
        }),
        "source/plugins/commerce/app-management/README.md":
          "# App Management\n",
        "source/plugins/commerce/app-management/skills/commerce-app-init/SKILL.md":
          "# Skill\n",
        "source/plugins/commerce/app-management/tile.json": JSON.stringify({
          name: "adobe/commerce-app-management",
          version: "1.2.0",
        }),
      },
      async (tempDir) => {
        const core = createCoreMock();
        const exec = createExecMock();
        const github = {
          rest: {
            pulls: {
              create: vi.fn().mockResolvedValue({ data: { number: 42 } }),
              list: vi.fn().mockResolvedValue({ data: [] }),
              update: vi.fn(),
            },
          },
        };
        const context = { sha: "abcdef1234567890" };

        exec.getExecOutput
          // git diff --name-only (detect changed plugins)
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: "plugins/commerce/app-management/package.json\n",
          })
          // git show HEAD^1:package.json (previous version)
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: JSON.stringify({
              name: "@adobe/aio-commerce-plugin-app-management",
              version: "1.1.1",
            }),
          })
          // git status --porcelain (has changes to commit)
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: " M plugins/commerce/app-management/tile.json\n",
          });

        await promoteSkills(
          asCore(core),
          asExec(exec),
          github as never,
          context as never,
          {
            skillsRepositoryPath: join(tempDir, "skills"),
            sourceRepositoryPath: join(tempDir, "source"),
          },
        );

        expect(core.setOutput).toHaveBeenCalledWith("promotedSkills", "true");
        expect(github.rest.pulls.create).toHaveBeenCalledOnce();
        expect(github.rest.pulls.create).toHaveBeenCalledWith(
          expect.objectContaining({
            base: "main",
            head: "promote/adobe-aio-commerce-sdk",
            owner: "adobe",
            repo: "skills",
          }),
        );
      },
    );
  });

  test("is a no-op when adobe/skills already reflects the promoted content", async () => {
    await withTempFiles(
      {
        "source/plugins/commerce/app-management/.claude-plugin/plugin.json":
          JSON.stringify({
            name: "commerce-app-management",
            repository: "https://github.com/adobe/aio-commerce-sdk",
            version: "1.2.0",
          }),
        "source/plugins/commerce/app-management/CHANGELOG.md": "",
        "source/plugins/commerce/app-management/package.json": JSON.stringify({
          name: "@adobe/aio-commerce-plugin-app-management",
          version: "1.2.0",
        }),
        "source/plugins/commerce/app-management/README.md":
          "# App Management\n",
        "source/plugins/commerce/app-management/skills/commerce-app-init/SKILL.md":
          "# Skill\n",
        "source/plugins/commerce/app-management/tile.json": JSON.stringify({
          name: "adobe/commerce-app-management",
          version: "1.2.0",
        }),
      },
      async (tempDir) => {
        const core = createCoreMock();
        const exec = createExecMock();
        const github = {
          rest: {
            pulls: {
              create: vi.fn(),
              list: vi.fn(),
              update: vi.fn(),
            },
          },
        };
        const context = { sha: "abcdef1234567890" };

        exec.getExecOutput
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: "plugins/commerce/app-management/package.json\n",
          })
          .mockResolvedValueOnce({
            exitCode: 0,
            stderr: "",
            stdout: JSON.stringify({
              name: "@adobe/aio-commerce-plugin-app-management",
              version: "1.1.1",
            }),
          })
          // git status --porcelain returns empty: skills already up to date
          .mockResolvedValueOnce({ exitCode: 0, stderr: "", stdout: "" });

        await promoteSkills(
          asCore(core),
          asExec(exec),
          github as never,
          context as never,
          {
            skillsRepositoryPath: join(tempDir, "skills"),
            sourceRepositoryPath: join(tempDir, "source"),
          },
        );

        expect(core.setOutput).toHaveBeenCalledWith("promotedSkills", "false");
        expect(github.rest.pulls.create).not.toHaveBeenCalled();
      },
    );
  });

  test("builds the promotion pull request body from changelog entries", () => {
    expect(
      buildPromotionPullRequestBody([
        {
          changelogEntries: ["- Add App Management skills."],
          displayName: "commerce-app-management",
          version: "1.0.0",
        },
        {
          changelogEntries: [],
          displayName: "commerce-app-migration",
          version: "1.0.0",
        },
      ]),
    ).toBe(
      [
        "## commerce-app-management v1.0.0",
        "",
        "- Add App Management skills.",
        "",
        "## commerce-app-migration v1.0.0",
        "",
        "- Promote commerce-app-migration v1.0.0.",
      ].join("\n"),
    );
  });
});
