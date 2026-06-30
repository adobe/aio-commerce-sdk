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

import type { ImsContext } from "#web/react/auth/types";
import type { SharedContextState } from "#web/react/commerce/types";
import type { ShellConfiguration } from "#web/react/shell/types";

/**
 * Resolves IMS credentials from Experience Shell first, then Commerce shared context.
 *
 * @param shellConfiguration - The Experience Shell configuration, if available.
 * @param sharedContext - The Commerce shared context, if available.
 */
export function resolveImsCredentials(
  shellConfiguration: ShellConfiguration | null,
  sharedContext: SharedContextState["sharedContext"],
): ImsContext | null {
  const imsToken =
    shellConfiguration?.imsToken ??
    (sharedContext?.get("imsToken") as string) ??
    null;

  const imsOrgId =
    shellConfiguration?.imsOrg ??
    (sharedContext?.get("imsOrgId") as string) ??
    null;

  if (!(imsToken && imsOrgId)) {
    return null;
  }

  return { imsToken, imsOrgId };
}
