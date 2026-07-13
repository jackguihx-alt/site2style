#!/usr/bin/env node

import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildStyleProfile, styleProfileToMarkdown } from "../lib/style-profile.mjs";

function parseArgs(argv) {
  const options = { positionals: [], markdownPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--markdown") {
      options.markdownPath = argv[++index];
    } else if (value.startsWith("--markdown=")) {
      options.markdownPath = value.slice("--markdown=".length);
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      options.positionals.push(value);
    }
  }
  if (!options.positionals[0]) throw new Error("Evidence JSON path is required");
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const evidencePath = path.resolve(options.positionals[0]);
  const outputPath = path.resolve(
    options.positionals[1] || path.join(path.dirname(evidencePath), "style-profile.json")
  );
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const profile = buildStyleProfile(evidence);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(profile, null, 2)}\n`);

  let markdownPath = null;
  if (options.markdownPath) {
    markdownPath = path.resolve(options.markdownPath);
    await mkdir(path.dirname(markdownPath), { recursive: true });
    await writeFile(markdownPath, `${styleProfileToMarkdown(profile)}\n`);
  }

  console.log(JSON.stringify({
    evidencePath,
    outputPath,
    markdownPath,
    viewportCount: profile.source.viewportCount,
    colorSignals: profile.styleSignals.colors.length,
    typographyPatterns: profile.styleSignals.typographyPatterns.length,
    imageSamples: profile.imagery.samples.length,
    evidenceGaps: profile.evidenceGaps,
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
