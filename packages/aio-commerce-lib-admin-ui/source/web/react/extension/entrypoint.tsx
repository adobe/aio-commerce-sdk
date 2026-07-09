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

import {
  isControlFrame,
  isEmbeddedInHost,
  isUiFrame,
} from "#web/react/commerce/lib";

import { CommerceExtensionApp } from "./commerce-app";
import { ExperienceShellExtensionApp } from "./experience-shell-app";
import { StandaloneExtensionApp } from "./standalone-app";

import type { Runtime, RuntimeConfiguration } from "@adobe/exc-app";

/** The props received by the {@link Entrypoint} component. */
type EntrypointProps = {
  extensionId: string;
  initialConfigurationPromise: Promise<RuntimeConfiguration | null> | null;
  runtime: Runtime;
};

/**
 * The Entrypoint component is the main entry point for an extension app.
 * It picks between the Commerce Admin, Experience Cloud shell, and standalone flows.
 *
 * @param props - The props needed to initialize the extension app.
 */
export function Entrypoint(props: Readonly<EntrypointProps>) {
  const { extensionId, initialConfigurationPromise, runtime } = props;

  if (isUiFrame() || isControlFrame()) {
    return <CommerceExtensionApp extensionId={extensionId} />;
  }

  // The shell flow only applies when embedded in the Experience Cloud shell
  if (isEmbeddedInHost() && initialConfigurationPromise !== null) {
    return (
      <ExperienceShellExtensionApp
        initialConfigurationPromise={initialConfigurationPromise}
        runtime={runtime}
      />
    );
  }

  return <StandaloneExtensionApp />;
}
