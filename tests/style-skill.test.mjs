import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/create-style-skill.mjs", import.meta.url));

test("creates a standard Chinese design-style Skill with HTML preview", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "html2style-skill-"));
  const style = path.join(temp, "STYLE.md");
  const profile = path.join(temp, "style-profile.json");
  const preview = path.join(temp, "style-board.html");
  const measurements = path.join(temp, "measurements.md");
  const output = path.join(temp, "quiet-product-style");
  await Promise.all([
    fs.writeFile(style, "# STYLE: Quiet Product\n\n## Rules\n\nUse flat surfaces.\n", "utf8"),
    fs.writeFile(profile, JSON.stringify({ source: { url: "https://example.com" } }), "utf8"),
    fs.writeFile(preview, '<!doctype html><html><a href="STYLE.md">Open</a></html>', "utf8"),
    fs.writeFile(measurements, "# Measurements\n", "utf8"),
  ]);

  const result = spawnSync(process.execPath, [
    script,
    output,
    "--style", style,
    "--profile", profile,
    "--preview", preview,
    "--measurements", measurements,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const report = JSON.parse(result.stdout);
  const skill = await fs.readFile(path.join(output, "SKILL.md"), "utf8");
  const agent = await fs.readFile(path.join(output, "agents/openai.yaml"), "utf8");
  assert.equal(report.skillName, "quiet-product-style");
  assert.match(skill, /^---\nname: quiet-product-style\n/);
  assert.match(skill, /完整风格规则/);
  assert.match(skill, /https:\/\/example\.com/);
  assert.match(agent, /\$quiet-product-style/);
  const packagedPreview = await fs.readFile(path.join(output, "assets/preview.html"), "utf8");
  assert.match(packagedPreview, /href="\.\.\/references\/STYLE\.md"/);
  await fs.access(path.join(output, "references/STYLE.md"));
  await fs.access(path.join(output, "references/style-profile.json"));
  await fs.access(path.join(output, "references/measurements.md"));
});

test("creates an English design-style Skill", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "html2style-skill-en-"));
  const style = path.join(temp, "STYLE.md");
  const profile = path.join(temp, "style-profile.json");
  const preview = path.join(temp, "preview.html");
  const output = path.join(temp, "editorial-style");
  await Promise.all([
    fs.writeFile(style, "# STYLE: Editorial\n", "utf8"),
    fs.writeFile(profile, "{}", "utf8"),
    fs.writeFile(preview, "<!doctype html><html></html>", "utf8"),
  ]);

  const result = spawnSync(process.execPath, [
    script,
    output,
    "--style", style,
    "--profile", profile,
    "--preview", preview,
    "--locale", "en",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const skill = await fs.readFile(path.join(output, "SKILL.md"), "utf8");
  assert.match(skill, /# Editorial Web Style/);
  assert.match(skill, /complete style rules/);
  assert.doesNotMatch(skill, /references\/measurements\.md/);
});

test("refuses a folder name that does not match the normalized Skill name", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "html2style-skill-name-"));
  const style = path.join(temp, "STYLE.md");
  const profile = path.join(temp, "style-profile.json");
  const preview = path.join(temp, "preview.html");
  await Promise.all([
    fs.writeFile(style, "# STYLE: Test\n", "utf8"),
    fs.writeFile(profile, "{}", "utf8"),
    fs.writeFile(preview, "<!doctype html><html></html>", "utf8"),
  ]);
  const result = spawnSync(process.execPath, [
    script,
    path.join(temp, "Invalid Skill Name"),
    "--style", style,
    "--profile", profile,
    "--preview", preview,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must match the Skill name/);
});
