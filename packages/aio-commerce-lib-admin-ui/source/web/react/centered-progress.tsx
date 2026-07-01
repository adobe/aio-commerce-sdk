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

import { ProgressCircle } from "@react-spectrum/s2/ProgressCircle";

/**
 * A centered, indeterminate progress indicator used as a Suspense fallback.
 * @param props - The props needed to render the progress indicator.
 */
export function CenteredProgress(props: Readonly<{ "aria-label": string }>) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,

        // Subtract the padding to avoid generating overflow
        minHeight: "calc(100dvh - 48px)",
      }}>
      <ProgressCircle aria-label={props["aria-label"]} isIndeterminate />
    </div>
  );
}
