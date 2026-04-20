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

import { describe, expect, test } from "vitest";

import { parseReleaseChannel, runGitHubScript } from "#ci/release/utils";
import { asCore, createCoreMock } from "#test/fixtures/release";

describe("release/utils.ts", () => {
  describe("runGitHubScript", () => {
    test("returns the action result when the script is synchronous and succeeds", () => {
      const core = createCoreMock();
      const result = runGitHubScript(asCore(core), () => "ok");

      expect(result).toBe("ok");
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    test("returns the action result when the script is asynchronous and succeeds", async () => {
      const core = createCoreMock();
      const result = runGitHubScript(asCore(core), async () => "ok");

      await expect(result).resolves.toBe("ok");
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    test("marks the script as failed and rethrows synchronous errors", () => {
      const core = createCoreMock();
      expect(() =>
        runGitHubScript(asCore(core), () => {
          throw new Error("boom");
        }),
      ).toThrow();

      expect(core.setFailed).toHaveBeenCalledWith(expect.any(Error));
    });

    test("marks the script as failed and rethrows synchronous non-Error values", () => {
      const core = createCoreMock();
      expect(() =>
        runGitHubScript(asCore(core), () => {
          // biome-ignore lint/style/useThrowOnlyError: we want to test the non-Error value
          throw "boom";
        }),
      ).toThrow();

      expect(core.setFailed).toHaveBeenCalledWith("boom");
    });

    test("rejected promises are not caught and marked as failed", async () => {
      const core = createCoreMock();
      await expect(() =>
        runGitHubScript(asCore(core), () => Promise.reject("boom")),
      ).rejects.toBe("boom");

      expect(core.setFailed).not.toHaveBeenCalled();
    });
  });

  describe("parseReleaseChannel", () => {
    test("returns the release channel when it is valid", () => {
      expect(parseReleaseChannel("internal")).toBe("internal");
      expect(parseReleaseChannel("public")).toBe("public");
    });

    test("throws when the release channel is undefined", () => {
      expect(() => parseReleaseChannel(undefined)).toThrow();
    });
  });
});
