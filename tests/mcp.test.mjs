import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("MCP server exposes the portable workflow", { timeout: 120000 }, async () => {
  const client = new Client({ name: "site2style-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, "mcp/server.mjs")],
    cwd: root,
    stderr: "pipe",
    env: { WEBSITE_TO_DESIGN_TEST_MODE: "1" },
  });

  await client.connect(transport);
  const serverPid = transport.pid;
  try {
    const tools = await client.listTools();
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

    const result = await client.callTool({ name: "browser_doctor", arguments: {} });
    const payload = JSON.parse(result.content[0].text);
    assert.equal(payload.exitCode, 0);
    assert.equal(JSON.parse(payload.stdout).ready, true);
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }

  if (serverPid) {
    const exited = await waitForExit(serverPid, 5000);
    if (!exited) {
      try {
        process.kill(serverPid, "SIGKILL");
      } catch {
        // Process already exited between the check and cleanup.
      }
    }
    assert.equal(exited, true, `MCP server process ${serverPid} did not exit after transport close`);
  }
});

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}
