#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const server = new McpServer(
  { name: "html2style", version: "0.6.0" },
  {
    instructions:
      "Use browser_doctor first, then extract_website_evidence. Follow the user's language for human-facing files: use zh-CN for Chinese users and en for English users, while keeping tool names, filenames, and JSON fields in English. For style-only work, call extract_style_profile, synthesize STYLE.md, render the HTML preview, and finish with create_style_skill. Generate DESIGN.md only for replica-specific detail. For complete replicas, validate all asset URLs and audit original versus replica evidence before declaring success. For original sites inspired by a reference, transfer measured design principles while replacing source branding, content, assets, and information architecture.",
  }
);

server.registerTool(
  "browser_doctor",
  {
    title: "Check browser tooling",
    description: "Detect portable browser backends available on this machine. No Agent-specific plugin is required.",
    inputSchema: z.object({}),
  },
  async () => toolResult(await runScript("scripts/check-browser-tooling.mjs", ["--json"]))
);

server.registerTool(
  "extract_website_evidence",
  {
    title: "Extract website design evidence",
    description: "Open a website with Playwright or a system Chromium browser and capture DOM, computed styles, assets, SVG data, interaction states, and responsive screenshots.",
    inputSchema: z.object({
      url: z.string().min(1).describe("HTTP(S) or file URL to inspect"),
      outputPath: z.string().optional().describe("Evidence JSON output path, relative to the MCP process working directory unless absolute"),
      artifactsDir: z.string().optional().describe("Directory for screenshots and asset manifests"),
      headed: z.boolean().default(false).describe("Open a visible browser window"),
      loginWaitSeconds: z.number().min(0).default(0).describe("When headed, wait this many seconds for manual login before extraction"),
      screenshots: z.boolean().default(true).describe("Capture viewport screenshots"),
      profile: z.enum(["full", "standard", "minimal"]).default("full"),
      backend: z.enum(["auto", "playwright", "chrome", "agent-browser"]).default("auto"),
    }),
  },
  async ({ url, outputPath, artifactsDir, headed, loginWaitSeconds, screenshots, profile, backend }) => {
    const resolvedOutput = path.resolve(process.cwd(), outputPath || `website-design-evidence-${Date.now()}.json`);
    const args = [url, resolvedOutput, "--profile", profile, "--backend", backend];
    if (artifactsDir) args.push("--artifacts-dir", path.resolve(process.cwd(), artifactsDir));
    if (headed) args.push("--headed");
    if (loginWaitSeconds > 0) args.push("--login-wait", String(loginWaitSeconds));
    if (!screenshots) args.push("--no-screenshots");
    const result = await runScript("scripts/extract-browser-evidence.mjs", args);
    return toolResult({ ...result, outputPath: resolvedOutput });
  }
);

server.registerTool(
  "extract_style_profile",
  {
    title: "Extract measured style profile",
    description: "Convert browser evidence into a deterministic style-profile.json covering typography, colors, spacing, shape, composition, imagery, controls, and responsive changes.",
    inputSchema: z.object({
      evidencePath: z.string().min(1),
      outputPath: z.string().optional(),
      markdownPath: z.string().optional().describe("Optional measured STYLE markdown output"),
    }),
  },
  async ({ evidencePath, outputPath, markdownPath }) => {
    const resolvedEvidence = path.resolve(process.cwd(), evidencePath);
    const resolvedOutput = path.resolve(
      process.cwd(),
      outputPath || path.join(path.dirname(evidencePath), "style-profile.json")
    );
    const args = [resolvedEvidence, resolvedOutput];
    if (markdownPath) args.push("--markdown", path.resolve(process.cwd(), markdownPath));
    return toolResult(await runScript("scripts/extract-style-profile.mjs", args));
  }
);

server.registerTool(
  "create_style_skill",
  {
    title: "Create reusable design-style Skill",
    description: "Package STYLE.md, measured profile, and HTML preview as a standard portable Skill for reuse in later Agent sessions.",
    inputSchema: z.object({
      outputDir: z.string().min(1),
      stylePath: z.string().min(1),
      profilePath: z.string().min(1),
      previewPath: z.string().min(1),
      name: z.string().optional(),
      skillName: z.string().optional(),
      locale: z.enum(["zh-CN", "en"]).default("zh-CN"),
      measurementsPath: z.string().optional(),
    }),
  },
  async ({ outputDir, stylePath, profilePath, previewPath, name, skillName, locale, measurementsPath }) => {
    const args = [
      path.resolve(process.cwd(), outputDir),
      "--style", path.resolve(process.cwd(), stylePath),
      "--profile", path.resolve(process.cwd(), profilePath),
      "--preview", path.resolve(process.cwd(), previewPath),
      "--locale", locale,
    ];
    if (name) args.push("--name", name);
    if (skillName) args.push("--skill-name", skillName);
    if (measurementsPath) args.push("--measurements", path.resolve(process.cwd(), measurementsPath));
    return jsonScriptResult(await runScript("scripts/create-style-skill.mjs", args));
  }
);

server.registerTool(
  "bundle_design_package",
  {
    title: "Bundle portable design package",
    description: "Organize generated style outputs into one portable folder with human, Agent, and machine entry points for reuse across projects and AI sessions.",
    inputSchema: z.object({
      outputDir: z.string().min(1),
      stylePath: z.string().min(1),
      profilePath: z.string().min(1),
      boardPath: z.string().min(1),
      name: z.string().optional(),
      locale: z.enum(["zh-CN", "en"]).default("zh-CN").describe("Language for human-facing package files"),
      measurementsPath: z.string().optional(),
      evidencePath: z.string().optional(),
      artifactsDir: z.string().optional(),
      designPath: z.string().optional(),
      designBoardPath: z.string().optional(),
      iconsDir: z.string().optional(),
    }),
  },
  async ({ outputDir, stylePath, profilePath, boardPath, name, locale, measurementsPath, evidencePath, artifactsDir, designPath, designBoardPath, iconsDir }) => {
    const args = [
      path.resolve(process.cwd(), outputDir),
      "--style", path.resolve(process.cwd(), stylePath),
      "--profile", path.resolve(process.cwd(), profilePath),
      "--board", path.resolve(process.cwd(), boardPath),
    ];
    if (name) args.push("--name", name);
    args.push("--locale", locale);
    if (measurementsPath) args.push("--measurements", path.resolve(process.cwd(), measurementsPath));
    if (evidencePath) args.push("--evidence", path.resolve(process.cwd(), evidencePath));
    if (artifactsDir) args.push("--artifacts", path.resolve(process.cwd(), artifactsDir));
    if (designPath) args.push("--design", path.resolve(process.cwd(), designPath));
    if (designBoardPath) args.push("--design-board", path.resolve(process.cwd(), designBoardPath));
    if (iconsDir) args.push("--icons", path.resolve(process.cwd(), iconsDir));
    return jsonScriptResult(await runScript("scripts/create-design-package.mjs", args));
  }
);

server.registerTool(
  "extract_icon_library",
  {
    title: "Extract icon library",
    description: "Export standalone SVG files, metadata, and a searchable icon-library HTML page from browser evidence.",
    inputSchema: z.object({
      evidencePath: z.string().min(1),
      outputDir: z.string().min(1),
      prefix: z.string().optional(),
      accent: z.string().optional(),
    }),
  },
  async ({ evidencePath, outputDir, prefix, accent }) => {
    const args = [
      "--from-evidence",
      path.resolve(process.cwd(), evidencePath),
      "--out",
      path.resolve(process.cwd(), outputDir),
    ];
    if (prefix) args.push(`--prefix=${prefix}`);
    if (accent) args.push(`--accent=${accent}`);
    return toolResult(await runScript("scripts/extract-icons.mjs", args));
  }
);

server.registerTool(
  "render_design_preview",
  {
    title: "Render DESIGN.md preview",
    description: "Render DESIGN.md as a human-readable, self-contained HTML design-system presentation.",
    inputSchema: z.object({
      designPath: z.string().min(1),
      outputPath: z.string().min(1),
    }),
  },
  async ({ designPath, outputPath }) =>
    toolResult(
      await runScript("scripts/render-design-preview.mjs", [
        path.resolve(process.cwd(), designPath),
        path.resolve(process.cwd(), outputPath),
      ])
    )
);

server.registerTool(
  "render_visual_comparison",
  {
    title: "Render visual comparison",
    description: "Create a self-contained side-by-side and overlay HTML comparison from original and reconstruction screenshots.",
    inputSchema: z.object({
      originalPath: z.string().min(1),
      reconstructionPath: z.string().min(1),
      outputPath: z.string().min(1),
    }),
  },
  async ({ originalPath, reconstructionPath, outputPath }) =>
    toolResult(
      await runScript("scripts/render-visual-comparison.mjs", [
        path.resolve(process.cwd(), originalPath),
        path.resolve(process.cwd(), reconstructionPath),
        path.resolve(process.cwd(), outputPath),
      ])
    )
);

server.registerTool(
  "validate_asset_urls",
  {
    title: "Validate replica assets",
    description: "Parse HTML or browser evidence structurally, resolve image/srcset/CSS asset references, and verify every HTTP(S) or local file URL.",
    inputSchema: z.object({
      sourcePath: z.string().min(1).describe("HTML or evidence JSON path"),
      baseUrl: z.string().optional().describe("Base URL used to resolve relative references"),
      outputPath: z.string().optional().describe("Optional JSON report path"),
      timeoutMs: z.number().int().min(250).default(10000),
      concurrency: z.number().int().min(1).max(32).default(8),
    }),
  },
  async ({ sourcePath, baseUrl, outputPath, timeoutMs, concurrency }) => {
    const args = [path.resolve(process.cwd(), sourcePath), "--json", "--timeout", String(timeoutMs), "--concurrency", String(concurrency)];
    if (baseUrl) args.push("--base-url", baseUrl);
    if (outputPath) args.push("--output", path.resolve(process.cwd(), outputPath));
    return jsonScriptResult(
      await runScript("scripts/validate-asset-urls.mjs", args, { allowFailure: true })
    );
  }
);

server.registerTool(
  "audit_reconstruction",
  {
    title: "Audit reconstruction fidelity",
    description: "Compare original and replica browser evidence across viewport coverage, structure, responsive sources, gallery order, image health, and rendered/container geometry.",
    inputSchema: z.object({
      originalEvidencePath: z.string().min(1),
      replicaEvidencePath: z.string().min(1),
      mode: z.enum(["complete", "representative"]).default("complete"),
      outputPath: z.string().optional().describe("Optional JSON report path"),
    }),
  },
  async ({ originalEvidencePath, replicaEvidencePath, mode, outputPath }) => {
    const args = [
      path.resolve(process.cwd(), originalEvidencePath),
      path.resolve(process.cwd(), replicaEvidencePath),
      "--mode",
      mode,
      "--json",
    ];
    if (outputPath) args.push("--output", path.resolve(process.cwd(), outputPath));
    return jsonScriptResult(
      await runScript("scripts/audit-reconstruction.mjs", args, { allowFailure: true })
    );
  }
);

function runScript(relativePath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, relativePath), ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = { exitCode: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() };
      if (code === 0 || options.allowFailure) resolve(result);
      else reject(new Error(JSON.stringify(result, null, 2)));
    });
  });
}

function jsonScriptResult(result) {
  try {
    return toolResult({ exitCode: result.exitCode, stderr: result.stderr, report: JSON.parse(result.stdout) });
  } catch {
    return toolResult(result);
  }
}

function toolResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

const transport = new StdioServerTransport();
let shuttingDown = false;
async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(code), 500);
  await server.close().catch(() => {});
  clearTimeout(forceExit);
  process.exit(code);
}

process.stdin.once("end", () => { void shutdown(0); });
process.stdin.once("close", () => { void shutdown(0); });
process.once("SIGINT", () => { void shutdown(0); });
process.once("SIGTERM", () => { void shutdown(0); });

await server.connect(transport);
