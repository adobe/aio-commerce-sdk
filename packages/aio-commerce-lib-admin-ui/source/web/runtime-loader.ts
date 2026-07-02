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

import type { Runtime } from "@adobe/exc-app";

// Note this is the source code rebuilt from the below file:
// https://github.com/adobe/adobe-commerce-samples/blob/09e4c938ab54c186cecd9402ece9567796d6c21a/admin-ui-sdk/menu/custom-menu/src/commerce-backend-ui-1/web-src/src/exc-runtime.js

declare global {
  // Ambient type for typesafe `globalThis` access to `EXC_MR_READY`.
  var EXC_MR_READY: (() => void) | undefined;
}

const EXPERIENCE_CLOUD_RUNTIME_HOST_PATTERN =
  /^(exc-unifiedcontent\.)?experience(-qa|-stage|-cdn|-cdn-stage)?\.adobe\.(com|net)$/u;

/** Convenience no-operation function */
const noop = () => undefined;

/** Creates a mock implementation of the Experience Cloud runtime to be used when the real runtime is not available. */
export function createMockRuntime(): Runtime {
  return {
    configured: false,
    emit: noop,
    lastConfigurationPayload: null,
    off: noop,
    on: noop,
  };
}

/** Retrieve the URL of the Experience Cloud runtime script from the current page's query parameters or session storage. */
function getRuntimeScriptUrl() {
  const searchParam = new URL(globalThis.location.href).searchParams.get("_mr");
  return (
    searchParam || globalThis.sessionStorage.getItem("unifiedShellMRScript")
  );
}

/**
 * Loads the Experience Cloud runtime script into the current document.
 * @throws {Error} If the runtime script cannot be loaded due to a missing or invalid script URL.
 */
export function loadExperienceCloudRuntime() {
  const runtimeScriptUrl = getRuntimeScriptUrl();
  if (!runtimeScriptUrl) {
    throw new Error("Module Runtime: Missing script.");
  }

  const url = new URL(decodeURIComponent(runtimeScriptUrl));
  if (url.protocol !== "https:") {
    throw new Error("Module Runtime: Must be HTTPS.");
  }

  const isValidHost =
    EXPERIENCE_CLOUD_RUNTIME_HOST_PATTERN.test(url.hostname) ||
    url.hostname === "localhost.corp.adobe.com" ||
    url.hostname.endsWith(".localhost.corp.adobe.com");

  if (!isValidHost) {
    throw new Error("Module Runtime: Invalid domain.");
  }

  if (!url.pathname.endsWith(".js")) {
    throw new Error("Module Runtime: Must be a JavaScript file.");
  }

  globalThis.sessionStorage.setItem("unifiedShellMRScript", url.toString());

  // Add the script to the document head to load it asynchronously.
  const script = document.createElement("script");
  script.async = true;
  script.src = url.toString();
  script.onload = () => {
    if (
      "EXC_MR_READY" in globalThis &&
      typeof globalThis.EXC_MR_READY === "function"
    ) {
      globalThis.EXC_MR_READY();
    }
  };

  document.head.append(script);
}
