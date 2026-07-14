#!/usr/bin/env node

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...args] = process.argv.slice(2);

const commands = {
  doctor: "scripts/check-browser-tooling.mjs",
  extract: "scripts/extract-browser-evidence.mjs",
  icons: "scripts/extract-icons.mjs",
  preview: "scripts/render-design-preview.mjs",
  compare: "scripts/render-visual-comparison.mjs",
  profile: "scripts/extract-style-profile.mjs",
  bundle: "scripts/create-design-package.mjs",
  assets: "scripts/validate-asset-urls.mjs",
  audit: "scripts/audit-reconstruction.mjs",
};

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "mcp") {
  await import("../mcp/server.mjs");
} else if (commands[command]) {
  const result = spawnSync(process.execPath, [path.join(root, commands[command]), ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
} else {
  console.error(`Unknown command: ${command}\n`);
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`html2style

Agent-neutral website design-system extraction.

Commands:
  doctor                          Detect Playwright and system browsers
  extract <url> [output]          Capture DOM, styles, assets, icons, and screenshots
  icons --from-evidence <file>    Export a searchable SVG icon library
  preview <DESIGN.md> <html>      Render the human-readable design-system page
  compare <a.png> <b.png> <html> Build a visual comparison page
  profile <evidence> [output]      Build a measured transferable style profile
  bundle <dir> --style <file>      Create a localized cross-session design package
  assets <html-or-evidence>       Validate every referenced asset URL
  audit <original> <replica>      Audit complete or representative fidelity
  mcp                             Start the stdio MCP server

Examples:
  html2style doctor
  html2style extract https://example.com evidence.json --profile full
  html2style extract https://example.com evidence.json --headed --login-wait 60
  html2style icons --from-evidence evidence.json --out icons
  html2style profile evidence.json style-profile.json --markdown STYLE-measurements.md
  html2style bundle design-package --style STYLE.md --profile style-profile.json --board style-board.html --locale zh-CN
  html2style assets replica.html --base-url https://example.com
  html2style audit original.json replica.json --mode complete
`);
}
