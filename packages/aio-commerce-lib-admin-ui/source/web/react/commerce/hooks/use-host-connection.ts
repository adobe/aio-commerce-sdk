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

import { useMemo } from "react";

import { useSharedContext } from "#web/react/commerce/context/shared-context.tsx";
import { actionsError, okActions } from "#web/react/result";

import type { HostConnection } from "#web/react/commerce/types";
import type { ActionsResult } from "#web/react/result";

/**
 * Host frame actions used to close the extension iframe and return control to the Commerce Admin.
 */
type HostFrameField = {
  close: () => Promise<void>;
  onError: () => Promise<void>;
};

/**
 * Returns typed helpers for interacting with the Commerce Admin host.
 *
 * @example
 * ```tsx
 * import { useHostConnection } from "@adobe/aio-commerce-lib-admin-ui/web";
 *
 * function DoneButton() {
 *   const { actions, error } = useHostConnection();
 *   if (error) return null;
 *   return <button onClick={actions.close}>Done</button>;
 * }
 * ```
 */
export function useHostConnection(): ActionsResult<HostConnection> {
  const { data, error: contextError } = useSharedContext();

  return useMemo<ActionsResult<HostConnection>>(() => {
    if (contextError) {
      return actionsError(contextError.message, { cause: contextError });
    }

    const { field } = data.host as { field?: HostFrameField };
    if (!field) {
      return actionsError(
        "Host frame actions are unavailable. They require an established guest connection with a host that exposes frame actions.",
      );
    }

    return okActions({
      close: () => field.close(),
      closeWithError: () => field.onError(),
    });
  }, [data, contextError]);
}
