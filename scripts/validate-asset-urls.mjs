#!/usr/bin/env node

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { validateAssetSource } from "../lib/asset-validator.mjs";

function parseArgs(argv) {
  const options = {
    inputPath: null,
    baseUrl: null,
    outputPath: null,
    timeoutMs: 10000,
    concurrency: 8,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--base-url") {
      options.baseUrl = argv[++index];
    } else if (value.startsWith("--base-url=")) {
      options.baseUrl = value.slice("--base-url=".length);
    } else if (value === "--output") {
      options.outputPath = argv[++index];
    } else if (value.startsWith("--output=")) {
      options.outputPath = value.slice("--output=".length);
    } else if (value === "--timeout") {
      options.timeoutMs = Number(argv[++index]);
    } else if (value.startsWith("--timeout=")) {
      options.timeoutMs = Number(value.slice("--timeout=".length));
    } else if (value === "--concurrency") {
      options.concurrency = Number(argv[++index]);
    } else if (value.startsWith("--concurrency=")) {
      options.concurrency = Number(value.slice("--concurrency=".length));
    } else if (value === "--json") {
      options.json = true;
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else if (!options.inputPath) {
      options.inputPath = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }

  if (!options.inputPath) throw new Error("An HTML or evidence JSON path is required");
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 250) {
    throw new Error("--timeout must be at least 250 milliseconds");
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 32) {
    throw new Error("--concurrency must be an integer from 1 to 32");
  }
  return options;
}

function printHuman(report) {
  const status = report.passed ? "PASS" : "FAIL";
  console.log(`Asset validation: ${status}`);
  console.log(`Input: ${report.inputPath}`);
  console.log(
    `References: ${report.summary.referenceCount}; unique: ${report.summary.uniqueUrlCount}; ` +
      `ok: ${report.summary.ok}; failed: ${report.summary.failed}; skipped: ${report.summary.skipped}`
  );
  for (const item of report.results.filter((result) => !result.ok)) {
    console.log(`- ${item.url}: ${item.status ?? item.error ?? "unavailable"}`);
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const report = await validateAssetSource(options.inputPath, options);
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
