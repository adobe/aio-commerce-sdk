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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createMockRuntime } from "#test/fixtures/exc-app";
import { mockConsole } from "#test/utils/console";
import { stubShellFrame, stubStandaloneFrame } from "#test/utils/frame";
import { createExtensionApp } from "#web/react/extension/create-app.tsx";

// @adobe/exc-app and the runtime loader reach the real Experience Cloud shell/runtime; they are the
// external boundaries faked here. react-dom, the router, and the Entrypoint all run for real.
const mocks = vi.hoisted(() => ({
  createMockRuntime: vi.fn(),
  init: vi.fn(),
  loadExperienceCloudRuntime: vi.fn(),
  page: { done: vi.fn(), title: "" },
  runtimeFactory: vi.fn(),
}));

// The real `@adobe/exc-app` is CJS: the browser's ESM interop resolves the default import to the whole
// module object, so the mock's `default` must be the callable module itself.
vi.mock("@adobe/exc-app", () =>
  Object.assign(mocks.runtimeFactory, {
    default: mocks.runtimeFactory,
    init: mocks.init,
  }),
);

vi.mock("@adobe/exc-app/page", () =>
  Object.assign(mocks.page, { default: mocks.page }),
);

vi.mock("#web/runtime-loader", () => ({
  createMockRuntime: mocks.createMockRuntime,
  loadExperienceCloudRuntime: mocks.loadExperienceCloudRuntime,
}));

const OPTIONS = {
  menu: <div data-testid="route-content" />,
  metadata: { extensionId: "ext-1" },
};

let restoreFrame: () => void = () => undefined;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.page.done.mockResolvedValue(undefined);
  mocks.loadExperienceCloudRuntime.mockReturnValue(undefined);

  document.body.innerHTML = '<div id="root"></div>';
  restoreFrame = stubStandaloneFrame();
});

afterEach(() => {
  restoreFrame();

  delete document.documentElement.dataset.colorScheme;
  document.body.innerHTML = "";

  vi.restoreAllMocks();
});

describe("createExtensionApp", () => {
  test.each(["/", "#/"])(
    "throws when the menu is also declared as the %s root route",
    (path) => {
      expect(() =>
        createExtensionApp({
          ...OPTIONS,
          routes: [{ element: <div />, path }],
        }),
      ).toThrow('The "/" route is reserved for the menu.');
    },
  );

  test("allows a root route when no menu is configured", async () => {
    mocks.createMockRuntime.mockReturnValue(createMockRuntime());
    mocks.loadExperienceCloudRuntime.mockImplementation(() => {
      throw new Error("no shell");
    });

    createExtensionApp({
      metadata: OPTIONS.metadata,
      routes: [{ element: <div data-testid="route-content" />, path: "#/" }],
    });

    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-testid="route-content"]'),
      ).not.toBeNull(),
    );
  });

  test("throws when no #root element exists and no root option is given", () => {
    document.body.innerHTML = "";
    expect(() => createExtensionApp(OPTIONS)).toThrow(
      'Could not find an element with id "root".',
    );
  });

  test("uses the provided root option without querying the DOM for #root", async () => {
    const getById = vi.spyOn(document, "getElementById");
    const root = document.createElement("div");
    document.body.append(root);

    // no shell runtime, so it renders the standalone app immediately.
    mocks.createMockRuntime.mockReturnValue(createMockRuntime());
    mocks.loadExperienceCloudRuntime.mockImplementation(() => {
      throw new Error("no shell");
    });

    createExtensionApp({ ...OPTIONS, root });
    expect(getById).not.toHaveBeenCalled();

    await vi.waitFor(() =>
      expect(
        root.querySelector('[data-testid="route-content"]'),
      ).not.toBeNull(),
    );
  });

  test("renders through the shell path and registers a ready handler", () => {
    const runtime = createMockRuntime();
    mocks.runtimeFactory.mockReturnValue(runtime);
    mocks.init.mockImplementation((cb: () => void) => cb());

    createExtensionApp(OPTIONS);

    expect(runtime.on).toHaveBeenCalledWith("ready", expect.any(Function));
    expect(mocks.page.title).toBe(document.title);
  });

  test("resolves with the ready payload, marks the page done, and applies its theme", async () => {
    // The shell flow only renders when embedded in the Experience Cloud shell.
    restoreFrame();
    restoreFrame = stubShellFrame();

    const runtime = createMockRuntime();
    mocks.runtimeFactory.mockReturnValue(runtime);
    mocks.init.mockImplementation((cb: () => void) => cb());

    createExtensionApp(OPTIONS);
    runtime.handlers.ready({ imsOrg: "o", imsToken: "t", theme: "light" });

    await vi.waitFor(() =>
      expect(document.documentElement.dataset.colorScheme).toBe("light"),
    );

    expect(mocks.page.done).toHaveBeenCalledTimes(1);
  });

  test("falls back to the runtime's last configuration payload when ready has no payload", async () => {
    // The shell flow only renders when embedded in the Experience Cloud shell.
    restoreFrame();
    restoreFrame = stubShellFrame();

    const runtime = createMockRuntime({
      // @ts-expect-error -- partial config data cannot satisfy the exc-app RuntimeConfiguration type
      lastConfigurationPayload: { imsOrg: "o", imsToken: "t", theme: "dark" },
    });

    mocks.runtimeFactory.mockReturnValue(runtime);
    mocks.init.mockImplementation((cb: () => void) => cb());

    createExtensionApp(OPTIONS);
    runtime.handlers.ready(undefined);

    await vi.waitFor(() =>
      expect(document.documentElement.dataset.colorScheme).toBe("dark"),
    );
  });

  test("warns when marking the page done fails", async () => {
    const warn = mockConsole("warn");
    mocks.page.done.mockRejectedValue(new Error("shell gone"));

    const runtime = createMockRuntime();
    mocks.runtimeFactory.mockReturnValue(runtime);
    mocks.init.mockImplementation((cb: () => void) => cb());

    createExtensionApp(OPTIONS);
    runtime.handlers.ready(undefined);

    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        "Failed to mark page as done in Experience Cloud Shell.",
      ),
    );
  });

  test("renders with a mock runtime and no configuration when the shell runtime fails to load", async () => {
    mocks.createMockRuntime.mockReturnValue(createMockRuntime());
    mocks.loadExperienceCloudRuntime.mockImplementation(() => {
      throw new Error("no shell");
    });

    createExtensionApp(OPTIONS);

    expect(mocks.createMockRuntime).toHaveBeenCalledTimes(1);
    expect(mocks.init).not.toHaveBeenCalled();

    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-testid="route-content"]'),
      ).not.toBeNull(),
    );
  });
});
