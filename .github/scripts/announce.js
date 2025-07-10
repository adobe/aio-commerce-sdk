// Script to generate Slack notification payload for newly published npm packages.
// Arguments:
//   - A JSON string representing an array of published packages, each with "name" and "version" properties.
// Output:
//   - Prints a single-line JSON string to stdout, to be used as Slack webhook payload.
//
// Usage (local test):
//   node .github/scripts/announce.js '[{"name":"@adobe/aio-commerce-sdk","version":"0.2.0"},{"name":"@adobe/aio-commerce-lib-core","version":"0.2.0"}]'
//
// Usage (send to Slack):
//   SLACK_WEBHOOK_PAYLOAD=$(node .github/scripts/announce.js '[{"name":"@adobe/aio-commerce-sdk","version":"0.2.0"},{"name":"@adobe/aio-commerce-lib-core","version":"0.2.0"}]') curl -X POST -H 'Content-type: application/json' --data "$SLACK_WEBHOOK_PAYLOAD" $SLACK_WEBHOOK_URL

const repo = "adobe/aio-commerce-sdk";
const repoUrl = `https://github.com/${repo}`;

/**
 * Formats an announcement for Slack based on the published packages.
 * @param {Array<{name: string, version: string}>} publishedPackages
 * @returns {string} The announcement text mrkdwn format
 * @see https://api.slack.com/reference/surfaces/formatting#basic-formatting
 */
function formatMrkdwnAnnouncement(publishedPackages) {
  // Sort packages to ensure consistent order
  publishedPackages.sort((a, b) => {
    if (a.name === "@adobe/aio-commerce-sdk") {
      return -1;
    }
    if (b.name === "@adobe/aio-commerce-sdk") {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  let announcement = `:rocket: New published packages for <${repoUrl}|Adobe Commerce SDK for App Builder>\n\n`;
  for (const pkg of publishedPackages) {
    const pkgRelease = `${pkg.name}@${pkg.version}`;
    const pkgReleaseUrl = `${repoUrl}/releases/tag/${pkgRelease}`;
    const pkgNpmUrl = `https://www.npmjs.com/package/${pkg.name}`;
    announcement += `\u2007• \`${pkgRelease}\`: Read the <${pkgReleaseUrl}|release notes⇗>. See on <${pkgNpmUrl}|npm⇗>.\n`;
  }
  return announcement.trimEnd();
}

function main() {
  const publishedPackages = JSON.parse(process.argv[2] || "[]");
  const announcement = formatMrkdwnAnnouncement(publishedPackages);
  const webhookBody = JSON.stringify({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: announcement,
        },
      },
    ],
  });
  process.stdout.write(webhookBody);
}

main();
