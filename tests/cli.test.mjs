import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { backendCandidates } from "../lib/browser-tooling.mjs";
import { VIEWPORT_PROFILES } from "../lib/viewports.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("full profile covers five responsive source conditions", () => {
  assert.deepEqual(
    VIEWPORT_PROFILES.full.map(({ name, width, height }) => [name, width, height]),
    [
      ["desktop", 1440, 900],
      ["desktop-short", 1440, 720],
      ["tablet", 1024, 768],
      ["tablet-short", 1024, 700],
      ["mobile", 390, 844],
    ]
  );
});

test("CLI exposes portable commands", () => {
  const result = spawnSync(process.execPath, [path.join(root, "bin/html2style.mjs"), "--help"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor/);
  assert.match(result.stdout, /extract/);
  assert.match(result.stdout, /profile/);
  assert.match(result.stdout, /skill/);
  assert.match(result.stdout, /bundle/);
  assert.match(result.stdout, /assets/);
  assert.match(result.stdout, /audit/);
  assert.match(result.stdout, /mcp/);
});

test("browser doctor emits machine-readable output", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/check-browser-tooling.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.ok(result.status === 0 || result.status === 1, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(typeof output.ready, "boolean");
  assert.equal(typeof output.platform, "string");
});

test("system Chrome is identified as a direct CDP backend", () => {
  const tooling = {
    playwright: null,
    chromePath: "/example/chrome",
    agentBrowserPath: null,
  };

  assert.deepEqual(backendCandidates(tooling), [
    { backend: "chrome-cdp", path: "/example/chrome" },
  ]);
  assert.deepEqual(backendCandidates(tooling, "chrome"), [
    { backend: "chrome-cdp", path: "/example/chrome" },
  ]);
  assert.deepEqual(backendCandidates(tooling, "chrome-cli"), [
    { backend: "chrome-cdp", path: "/example/chrome" },
  ]);
});
