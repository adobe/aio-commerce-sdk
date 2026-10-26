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

import { init as initDb } from "@adobe/aio-lib-db";

async function _checkDbApiTypes() {
  const db = await initDb({ region: "emea", token: "token" });
  const client = await db.connect();
  client.collection("records");

  // @ts-expect-error tokens must be strings
  await initDb({ token: 123 });

  // @ts-expect-error only documented database regions are supported
  await initDb({ region: "moon", token: "token" });

  // @ts-expect-error index directions must use the supported numeric values
  await client.collection("records").createIndex({ order_id: "ascending" });
}
