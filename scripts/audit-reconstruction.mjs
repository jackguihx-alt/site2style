#!/usr/bin/env node

import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { auditReconstruction } from "../lib/reconstruction-audit.mjs";

function parseArgs(argv) {
  const options = {
    positionals: [],
    mode: "complete",
    outputPath: null,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--mode") {
      options.mode = argv[++index];
    } else if (value.startsWith("--mode=")) {
      options.mode = value.slice("--mode=".length);
    } else if (value === "--output") {
      options.outputPath = argv[++index];
    } else if (value.startsWith("--output=")) {
      options.outputPath = value.slice("--output=".length);
    } else if (value === "--json") {
      options.json = true;
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      options.positionals.push(value);
    }
  }

  if (options.positionals.length !== 2) {
    throw new Error("Original and replica evidence JSON paths are required");
  }
  if (!new Set(["complete", "representative"]).has(options.mode)) {
    throw new Error("--mode must be complete or representative");
  }
  return options;
}

function printHuman(report) {
  console.log(`Reconstruction audit: ${report.passed ? "PASS" : "FAIL"} (${report.mode})`);
  console.log(
    `Viewports: ${report.summary.comparedViewports}/${report.summary.expectedViewports}; ` +
      `failures: ${report.summary.failures}; warnings: ${report.summary.warnings}`
  );
  for (const issue of report.failures) {
    console.log(`- FAIL${issue.viewport ? ` [${issue.viewport}]` : ""}: ${issue.message}`);
  }
  for (const issue of report.warnings) {
    console.log(`- WARN${issue.viewport ? ` [${issue.viewport}]` : ""}: ${issue.message}`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const [originalPath, replicaPath] = options.positionals.map((value) => path.resolve(value));
  const [original, replica] = await Promise.all([
    readFile(originalPath, "utf8").then(JSON.parse),
    readFile(replicaPath, "utf8").then(JSON.parse),
  ]);
  const report = {
    originalPath,
    replicaPath,
    ...auditReconstruction(original, replica, { mode: options.mode }),
  };

  if (options.outputPath) {
    const outputPath = path.resolve(options.outputPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  process.exitCode = report.passed ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
