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
import { render } from "vitest-browser-react";

import { CenteredProgress } from "#web/react/centered-progress.tsx";

describe("CenteredProgress", () => {
  test("renders an indeterminate progress indicator with the given aria-label", async () => {
    const screen = await render(
      <CenteredProgress aria-label="Loading extension" />,
    );

    const progress = screen.getByRole("progressbar", {
      name: "Loading extension",
    });

    await expect.element(progress).toBeInTheDocument();
    await expect.element(progress).not.toHaveAttribute("aria-valuenow");
  });
});
