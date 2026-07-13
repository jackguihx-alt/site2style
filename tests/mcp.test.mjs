import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("MCP server exposes the portable workflow", { timeout: 30000 }, async () => {
  const child = spawn(process.execPath, [path.join(root, "mcp/server.mjs")], {
    cwd: root,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const rpc = createRpcHarness(child);

  try {
    const initialized = await rpc.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "html2style-test", version: "1.0.0" },
    });
    assert.equal(initialized.serverInfo.name, "html2style");
    rpc.notify("notifications/initialized", {});

    const tools = await rpc.request("tools/list", {});
    assert.deepEqual(
      tools.tools.map((tool) => tool.name),
      [
        "browser_doctor",
        "extract_website_evidence",
        "extract_style_profile",
        "bundle_design_package",
        "extract_icon_library",
        "render_design_preview",
        "render_visual_comparison",
        "validate_asset_urls",
        "audit_reconstruction",
      ]
    );

    const result = await rpc.request("tools/call", { name: "browser_doctor", arguments: {} });
    const payload = JSON.parse(result.content[0].text);
    assert.equal(payload.exitCode, 0);
    assert.equal(JSON.parse(payload.stdout).ready, true);
  } finally {
    child.stdin.end();
    let exited = await waitForClose(child, 1000);
    if (!exited) {
      child.kill("SIGTERM");
      exited = await waitForClose(child, 3000);
    }
    if (!exited) {
      child.kill("SIGKILL");
      await waitForClose(child, 1000);
    }
    assert.equal(exited, true, `MCP server did not exit cleanly. stderr: ${rpc.stderr()}`);
  }
});

function createRpcHarness(child) {
  let nextId = 1;
  let stdout = "";
  let stderr = "";
  const pending = new Map();

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
    while (stdout.includes("\n")) {
      const newline = stdout.indexOf("\n");
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      if (message.id === undefined) continue;
      const waiter = pending.get(message.id);
      if (!waiter) continue;
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    }
  });

  child.on("close", (code) => {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error(`MCP server exited with code ${code}. stderr: ${stderr}`));
    }
    pending.clear();
  });

  return {
    request(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timed out waiting for MCP response to ${method}. stderr: ${stderr}`));
        }, 10000);
        pending.set(id, { resolve, reject, timer });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    },
    notify(method, params) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
    },
    stderr: () => stderr,
  };
}

async function waitForClose(child, timeoutMs) {
  if (child.exitCode !== null) return true;
  return Promise.race([
    new Promise((resolve) => child.once("close", () => resolve(true))),
    new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
}
