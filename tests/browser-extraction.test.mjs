import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { detectBrowserTooling } from "../lib/browser-tooling.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("browser extraction records every full-profile viewport and picture source", { timeout: 180000 }, (t) => {
  const tooling = detectBrowserTooling(root);
  if (!tooling.playwright && !tooling.chromePath && !tooling.agentBrowserPath) {
    t.skip("No browser backend is installed");
    return;
  }

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "html2style-test-"));
  const outputPath = path.join(outputDir, "evidence.json");
  const fixtureUrl = pathToFileURL(path.join(root, "tests/fixtures/responsive.html")).href;
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/extract-browser-evidence.mjs"), fixtureUrl, outputPath, "--profile", "full", "--no-screenshots"],
    { cwd: root, encoding: "utf8", timeout: 170000 }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const evidence = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.deepEqual(Object.keys(evidence.pages), ["desktop", "desktop-short", "tablet", "tablet-short", "mobile"]);

  const expectedModes = {
    desktop: "large-tall",
    "desktop-short": "large-short",
    tablet: "medium-tall",
    "tablet-short": "medium-short",
    mobile: "small",
  };
  for (const [name, expected] of Object.entries(expectedModes)) {
    assert.equal(evidence.pages[name].dom.rootVariables["--capture-mode"], expected);
  }

  assert.equal(evidence.pages.desktop.assets.images[0].pictureSources.length, 2);
  assert.match(evidence.pages.desktop.assets.images[0].pictureSources[0].media, /734px/);
  assert.equal(evidence.pages.desktop.assets.images[0].renderedGeometry.width, 1440);
  assert.equal(evidence.pages.desktop.assets.images[0].renderedGeometry.height, 400);
  assert.ok(Number.isFinite(evidence.pages.desktop.assets.images[0].renderedGeometry.y));
  assert.equal(evidence.pages.desktop.assets.images[0].intrinsicGeometry.width, 1440);
  assert.equal(evidence.pages.desktop.assets.images[0].picture.tag, "picture");
  assert.equal(evidence.pages.desktop.assets.images[0].owner.tag, "section");
  assert.equal(evidence.pages.desktop.structure.counts.galleryItems, 1);
  assert.equal(evidence.pages.desktop.galleryItems.length, 1);
  assert.equal(evidence.pages.desktop.galleryItems[0].ariaLabel, "Gallery item one");
  assert.equal(evidence.pages.desktop.galleryItems[0].images.length, 1);
  assert.equal(evidence.pages.desktop.structure.counts.footerGroups, 1);
  assert.equal(evidence.pages.desktop.structure.footerGroups[0].heading, "Resources");
  fs.rmSync(outputDir, { recursive: true, force: true });
});
