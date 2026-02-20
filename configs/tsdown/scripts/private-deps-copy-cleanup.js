#!/usr/bin/env node
import { rename } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  const CWD = process.cwd();
  const logger = console;

  const pkgJsonPath = join(CWD, "package.json");
  const origPkgJsonPath = join(CWD, "package.json.orig");

  try {
    await rename(origPkgJsonPath, pkgJsonPath);
    logger.info("✓ Successfully cleaned up [deps:copy] artifacts");
  } catch (err) {
    logger.error(
      "✗ Failed to restore original package.json from [deps:copy] artifacts",
    );
    logger.error(err);
  }
}

await main();
