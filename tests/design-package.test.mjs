import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/create-design-package.mjs", import.meta.url));

test("bundle creates a portable cross-session design package", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "website-design-package-"));
  const style = path.join(temp, "source-STYLE.md");
  const profile = path.join(temp, "source-profile.json");
  const board = path.join(temp, "source-board.html");
  const evidence = path.join(temp, "source-evidence.json");
  const output = path.join(temp, "design-package");

  await Promise.all([
    fs.writeFile(style, "# STYLE: Quiet Product Editorial\n\n## Transferability Boundary\n\nReplace source identity.\n", "utf8"),
    fs.writeFile(profile, JSON.stringify({
      source: { url: "https://example.com", capturedAt: "2026-07-13", viewportCount: 3 },
      viewports: { desktop: {}, tablet: {}, mobile: {} },
      evidenceGaps: ["Motion was not captured."],
    }), "utf8"),
    fs.writeFile(board, "<!doctype html><html><title>Style board</title></html>", "utf8"),
    fs.writeFile(evidence, "{}", "utf8"),
  ]);

  const result = spawnSync(process.execPath, [
    script,
    output,
    "--style", style,
    "--profile", profile,
    "--board", board,
    "--evidence", evidence,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const report = JSON.parse(result.stdout);
  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const start = await fs.readFile(path.join(output, "START-HERE.md"), "utf8");
  const handoff = await fs.readFile(path.join(output, "AGENT-HANDOFF.md"), "utf8");

  assert.match(report.packageId, /^design-language-[a-f0-9]{12}$/);
  assert.equal(manifest.packageId, report.packageId);
  assert.equal(manifest.locale, "zh-CN");
  assert.equal(manifest.entrypoints.human, "START-HERE.html");
  assert.equal(manifest.entrypoints.agent, "AGENT-HANDOFF.md");
  assert.equal(manifest.source.url, "https://example.com");
  assert.ok(manifest.files.some((item) => item.path === "evidence/evidence.json"));
  assert.match(start, /之后的新 AI session/);
  assert.match(start, /Motion was not captured/);
  assert.match(handoff, /不要浏览或重新采集/);
  assert.match(handoff, /Package ID/);
  await fs.access(path.join(output, "STYLE.md"));
  const startHtml = await fs.readFile(path.join(output, "START-HERE.html"), "utf8");
  assert.match(startHtml, /查看风格板/);
  assert.match(startHtml, /复制 Agent 提示词/);
  await fs.access(path.join(output, "style-board.html"));
  await fs.access(path.join(output, "style-profile.json"));
  await fs.access(path.join(output, "evidence/evidence.json"));
});

test("bundle can generate English human-facing files", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "website-design-package-en-"));
  const style = path.join(temp, "STYLE.md");
  const profile = path.join(temp, "profile.json");
  const board = path.join(temp, "board.html");
  const output = path.join(temp, "design-package");
  await Promise.all([
    fs.writeFile(style, "# STYLE: Test\n", "utf8"),
    fs.writeFile(profile, "{}", "utf8"),
    fs.writeFile(board, "<!doctype html><html></html>", "utf8"),
  ]);

  const result = spawnSync(process.execPath, [
    script,
    output,
    "--style", style,
    "--profile", profile,
    "--board", board,
    "--locale", "en",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const start = await fs.readFile(path.join(output, "START-HERE.md"), "utf8");
  const handoff = await fs.readFile(path.join(output, "AGENT-HANDOFF.md"), "utf8");
  assert.equal(manifest.locale, "en");
  assert.match(start, /another project or opened in a later AI session/);
  assert.match(handoff, /Do not browse or re-extract/);
});

test("bundle refuses to merge into an existing directory", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "website-design-package-existing-"));
  const output = path.join(temp, "design-package");
  const style = path.join(temp, "STYLE.md");
  const profile = path.join(temp, "profile.json");
  const board = path.join(temp, "board.html");
  await Promise.all([
    fs.writeFile(style, "# STYLE: Test\n", "utf8"),
    fs.writeFile(profile, "{}", "utf8"),
    fs.writeFile(board, "<!doctype html><html></html>", "utf8"),
  ]);
  await fs.mkdir(output);
  const result = spawnSync(process.execPath, [script, output, "--style", style, "--profile", profile, "--board", board], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists/);
});
