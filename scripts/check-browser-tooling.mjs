#!/usr/bin/env node

import { backendCandidates, detectBrowserTooling, summarizeBrowserTooling } from "../lib/browser-tooling.mjs";

const json = process.argv.includes("--json");
const tooling = detectBrowserTooling(process.cwd());
const summary = summarizeBrowserTooling(tooling);

if (json) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(summary.ready ? 0 : 1);
}

console.log("=== site2style browser doctor ===\n");
console.log(`platform:           ${summary.platform}`);
console.log(`node:               ${summary.node}`);
console.log(`Playwright package: ${summary.playwright ? `${summary.playwright.package} (${summary.playwright.entryPath})` : "not found"}`);
console.log(`system browser:     ${summary.chrome || "not found"}`);
console.log(`agent-browser:      ${summary.agentBrowser || "not found"}`);
console.log(`ready:              ${summary.ready ? "yes" : "no"}`);
console.log(`preferred backend:  ${summary.recommendedBackend || "none"}`);

const available = backendCandidates(tooling).map((item) => item.backend);
if (available.length) {
  console.log(`\nAvailable fallback chain: ${available.join(" -> ")}`);
  console.log("No Agent-specific browser plugin is required.");
} else {
  console.log("\nNo browser backend was found.");
  console.log("Install project dependencies and Chromium:");
  console.log("  npm install");
  console.log("  npx playwright install chromium");
  console.log("\nOr install Google Chrome, Chromium, or Microsoft Edge.");
}
