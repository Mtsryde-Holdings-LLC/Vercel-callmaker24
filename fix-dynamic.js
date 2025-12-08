const fs = require("fs");
const path = require("path");

const routesNeedingDynamic = [
  "src/app/api/call-center/agents/route.ts",
  "src/app/api/call-center/aws-connect/flows/route.ts",
  "src/app/api/call-center/aws-connect/metrics/route.ts",
  "src/app/api/call-center/aws-connect/queues/route.ts",
  "src/app/api/dashboard/stats/route.ts",
  "src/app/api/cron/send-scheduled/route.ts",
  "src/app/api/loyalty/portal/history/route.ts",
  "src/app/api/loyalty/portal/me/route.ts",
  "src/app/api/reports/campaigns/route.ts",
  "src/app/api/team/route.ts",
  "src/app/api/user/profile/route.ts",
  "src/app/api/test-email/route.ts",
];

for (const routePath of routesNeedingDynamic) {
  try {
    let content = fs.readFileSync(routePath, "utf8");

    // Check if already has dynamic export
    if (content.includes("export const dynamic")) {
      console.log(`Skipped (already has dynamic): ${routePath}`);
      continue;
    }

    // Find the first import statement
    const lines = content.split("\n");
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("import ")) {
        insertIndex = i;
        break;
      }
    }

    // Find the last import
    for (let i = insertIndex; i < lines.length; i++) {
      if (!lines[i].trim().startsWith("import ") && lines[i].trim() !== "") {
        insertIndex = i;
        break;
      }
    }

    // Insert dynamic export after imports
    lines.splice(insertIndex, 0, "", "export const dynamic = 'force-dynamic'");

    fs.writeFileSync(routePath, lines.join("\n"), "utf8");
    console.log(`Added dynamic export: ${routePath}`);
  } catch (err) {
    console.log(`Error with ${routePath}: ${err.message}`);
  }
}

console.log("Done!");
