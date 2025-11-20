// Script to get PR information from GitHub API.
// Arguments:
//   - prNumber: The PR number
//   - githubToken: GitHub token for API access
//   - repository: Repository in format "owner/repo"
// Output:
//   - Prints JSON to stdout with:
//     - prNumber: number
//     - baseRef: string
//     - headSha: string
//
// Usage:
//   node .github/scripts/get-pr-info.ts <prNumber> <githubToken> <repository>

type PRInfo = {
  prNumber: number;
  baseRef: string;
  headSha: string;
};

async function getPRInfo(
  prNumber: number,
  githubToken: string,
  repository: string,
): Promise<PRInfo> {
  const url = `https://api.github.com/repos/${repository}/pulls/${prNumber}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch PR info: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  const pr = (await response.json()) as {
    number: number;
    base: { ref: string };
    head: { sha: string };
  };

  return {
    prNumber: pr.number,
    baseRef: pr.base.ref,
    headSha: pr.head.sha,
  };
}

/** Entrypoint of the script. */
async function main() {
  const prNumber = Number.parseInt(process.argv[2] || "", 10);
  const githubToken = process.argv[3] || "";
  const repository = process.argv[4] || "";

  if (!(prNumber && githubToken && repository)) {
    console.error("Error: All arguments are required");
    console.error(
      "Usage: node .github/scripts/get-pr-info.ts <prNumber> <githubToken> <repository>",
    );
    process.exit(1);
  }

  try {
    const result = await getPRInfo(prNumber, githubToken, repository);
    process.stdout.write(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
