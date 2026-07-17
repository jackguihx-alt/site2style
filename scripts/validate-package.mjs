#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "SKILL.md",
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "package.json",
  ".github/workflows/ci.yml",
  "bin/html2style.mjs",
  "mcp/server.mjs",
  "scripts/extract-browser-evidence.mjs",
  "scripts/extract-style-profile.mjs",
  "scripts/create-style-skill.mjs",
  "scripts/create-design-package.mjs",
  "scripts/check-browser-tooling.mjs",
  "scripts/validate-asset-urls.mjs",
  "scripts/audit-reconstruction.mjs",
  "lib/asset-validator.mjs",
  "lib/style-profile.mjs",
  "lib/reconstruction-audit.mjs",
  "references/high-fidelity-reconstruction.md",
  "references/design-language-transfer.md",
  "references/apple-homepage-case-study.md",
  "assets/DESIGN.template.md",
  "assets/STYLE.template.md",
  "examples/product-editorial/design-package/STYLE.md",
  "examples/product-editorial/design-package/style-board.html",
  "examples/product-editorial/design-package/style-profile.json",
  "examples/product-editorial/design-package/START-HERE.md",
  "examples/product-editorial/design-package/START-HERE.html",
  "examples/product-editorial/design-package/AGENT-HANDOFF.md",
  "examples/product-editorial/design-package/manifest.json",
  "examples/product-editorial/product-editorial-style/SKILL.md",
  "examples/product-editorial/product-editorial-style/agents/openai.yaml",
  "examples/product-editorial/product-editorial-style/assets/preview.html",
  "examples/product-editorial/product-editorial-style/references/STYLE.md",
  "examples/product-editorial/product-editorial-style/references/style-profile.json",
];

for (const relativePath of required) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

const skill = fs.readFileSync(path.join(root, "SKILL.md"), "utf8");
if (!skill.startsWith("---\n") || !/\nname: html2style\n/.test(skill) || !/\ndescription: .+\n/.test(skill)) {
  throw new Error("SKILL.md frontmatter is invalid");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson.type !== "module" || !packageJson.bin?.["html2style"] || !packageJson.bin?.["html2style-mcp"]) {
  throw new Error("package.json is missing portable CLI or MCP entry points");
}
if (!packageJson.dependencies?.parse5) {
  throw new Error("package.json is missing the structured HTML parser dependency");
}

for (const filePath of listFiles(root).filter((filePath) => filePath.endsWith(".mjs"))) {
  const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Syntax check failed for ${path.relative(root, filePath)}:\n${result.stderr}`);
  }
}

const help = spawnSync(process.execPath, [path.join(root, "bin/html2style.mjs"), "--help"], {
  cwd: root,
  encoding: "utf8",
});
if (help.status !== 0 || !help.stdout.includes("Agent-neutral") || !help.stdout.includes("profile") || !help.stdout.includes("skill") || !help.stdout.includes("bundle") || !help.stdout.includes("assets") || !help.stdout.includes("audit")) {
  throw new Error("CLI help smoke test failed");
}

JSON.parse(fs.readFileSync(path.join(root, "examples/product-editorial/design-package/style-profile.json"), "utf8"));
JSON.parse(fs.readFileSync(path.join(root, "examples/product-editorial/design-package/manifest.json"), "utf8"));
JSON.parse(fs.readFileSync(path.join(root, "examples/product-editorial/product-editorial-style/references/style-profile.json"), "utf8"));

console.log(`Validated ${listFiles(root).filter((filePath) => filePath.endsWith(".mjs")).length} JavaScript modules.`);
console.log("Portable CLI, MCP entry point, Skill metadata, and required assets are present.");

function listFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(target));
    else files.push(target);
  }
  return files;
}
