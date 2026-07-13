#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const { outputDir, options } = parseArgs(process.argv.slice(2));
if (!outputDir || !options.style || !options.profile || !options.board) {
  printUsage();
  process.exit(1);
}

const outputPath = path.resolve(process.cwd(), outputDir);
const input = {
  style: path.resolve(process.cwd(), options.style),
  profile: path.resolve(process.cwd(), options.profile),
  board: path.resolve(process.cwd(), options.board),
  measurements: resolveOptional(options.measurements),
  evidence: resolveOptional(options.evidence),
  artifacts: resolveOptional(options.artifacts),
  design: resolveOptional(options.design),
  designBoard: resolveOptional(options.designBoard),
  icons: resolveOptional(options.icons),
};

await assertMissing(outputPath);
await assertFile(input.style, "STYLE.md");
await assertFile(input.profile, "style-profile.json");
await assertFile(input.board, "style-board.html");
for (const [key, value] of Object.entries(input)) {
  if (value && !["style", "profile", "board", "artifacts", "icons"].includes(key)) await assertFile(value, key);
}
if (input.artifacts) await assertDirectory(input.artifacts, "artifacts");
if (input.icons) await assertDirectory(input.icons, "icons");

const [styleText, profileText, boardText] = await Promise.all([
  fs.readFile(input.style, "utf8"),
  fs.readFile(input.profile, "utf8"),
  fs.readFile(input.board, "utf8"),
]);
const profile = parseProfile(profileText);
if (!/<html\b/i.test(boardText)) throw new Error("style-board input does not appear to be an HTML document");

const packageName = clean(options.name) || extractStyleName(styleText) || "Website Design Language";
const packageId = `design-language-${crypto.createHash("sha256").update(styleText).update(profileText).digest("hex").slice(0, 12)}`;
const tempPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.tmp-${process.pid}`);
const files = coreFiles();

try {
  await fs.mkdir(tempPath, { recursive: false });
  await Promise.all([
    fs.copyFile(input.style, path.join(tempPath, "STYLE.md")),
    fs.copyFile(input.profile, path.join(tempPath, "style-profile.json")),
    fs.copyFile(input.board, path.join(tempPath, "style-board.html")),
  ]);

  await copyOptionalFile(input.measurements, tempPath, "evidence/STYLE-measurements.md", "measured-summary", files);
  await copyOptionalFile(input.evidence, tempPath, "evidence/evidence.json", "browser-evidence", files);
  await copyOptionalDirectory(input.artifacts, tempPath, "evidence/artifacts", "browser-artifacts", files);
  await copyOptionalFile(input.design, tempPath, "advanced/DESIGN.md", "design-system", files);
  await copyOptionalFile(input.designBoard, tempPath, "advanced/design-system.html", "design-system-board", files);
  await copyOptionalDirectory(input.icons, tempPath, "advanced/icons", "icon-library", files);

  const manifest = {
    schemaVersion: 1,
    packageType: "website-design-language",
    packageId,
    name: packageName,
    createdAt: new Date().toISOString(),
    source: {
      url: profile.source?.url ?? null,
      capturedAt: profile.source?.capturedAt ?? null,
      viewportCount: profile.source?.viewportCount ?? Object.keys(profile.viewports ?? {}).length,
    },
    entrypoints: {
      human: "START-HERE.html",
      preview: "style-board.html",
      agent: "AGENT-HANDOFF.md",
      style: "STYLE.md",
      machine: "style-profile.json",
    },
    reuse: {
      instruction: "Ask any Agent to read AGENT-HANDOFF.md before creating or reviewing a design.",
      reExtractWhen: "The reference site changed or the evidence gaps block the new task.",
    },
    evidenceGaps: Array.isArray(profile.evidenceGaps) ? profile.evidenceGaps : [],
    files,
  };

  await Promise.all([
    fs.writeFile(path.join(tempPath, "START-HERE.md"), startHere({ packageName, packageId, manifest }), "utf8"),
    fs.writeFile(path.join(tempPath, "START-HERE.html"), startHereHtml({ packageName, packageId, manifest }), "utf8"),
    fs.writeFile(path.join(tempPath, "AGENT-HANDOFF.md"), agentHandoff({ packageName, packageId, manifest }), "utf8"),
    fs.writeFile(path.join(tempPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
  ]);
  await fs.rename(tempPath, outputPath);

  console.log(JSON.stringify({
    outputPath,
    packageId,
    name: packageName,
    sourceUrl: manifest.source.url,
    entrypoint: path.join(outputPath, "START-HERE.md"),
    agentHandoff: path.join(outputPath, "AGENT-HANDOFF.md"),
    humanEntrypoint: path.join(outputPath, "START-HERE.html"),
    humanPreview: path.join(outputPath, "style-board.html"),
    fileCount: files.length,
  }, null, 2));
} catch (error) {
  await fs.rm(tempPath, { recursive: true, force: true }).catch(() => {});
  throw error;
}

function parseArgs(args) {
  const [outputDir, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    options[key] = value;
    index += 1;
  }
  return { outputDir, options };
}

function printUsage() {
  console.error(`Usage:
  html2style bundle <output-dir> --style STYLE.md --profile style-profile.json --board style-board.html [options]

Options:
  --name <name>                 Human-readable package name
  --measurements <file>         STYLE-measurements.md
  --evidence <file>             Browser evidence JSON
  --artifacts <dir>             Screenshots and evidence artifacts
  --design <file>               Optional DESIGN.md
  --design-board <file>         Optional design-system.html
  --icons <dir>                 Optional icon library directory`);
}

function resolveOptional(value) {
  return value ? path.resolve(process.cwd(), value) : null;
}

async function assertMissing(target) {
  try {
    await fs.access(target);
    throw new Error(`Output directory already exists: ${target}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
}

async function assertFile(target, label) {
  const stat = await fs.stat(target).catch(() => null);
  if (!stat?.isFile()) throw new Error(`${label} must be a readable file: ${target}`);
}

async function assertDirectory(target, label) {
  const stat = await fs.stat(target).catch(() => null);
  if (!stat?.isDirectory()) throw new Error(`${label} must be a directory: ${target}`);
}

function parseProfile(text) {
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value;
  } catch (error) {
    throw new Error(`Invalid style-profile.json: ${error.message}`);
  }
}

function clean(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function extractStyleName(text) {
  return clean(text.match(/^#\s+(?:STYLE:\s*)?(.+)$/m)?.[1]);
}

function coreFiles() {
  return [
    { path: "START-HERE.md", role: "human-entrypoint", required: true },
    { path: "START-HERE.html", role: "human-entrypoint-html", required: true },
    { path: "AGENT-HANDOFF.md", role: "cross-session-agent-entrypoint", required: true },
    { path: "manifest.json", role: "package-manifest", required: true },
    { path: "STYLE.md", role: "agent-style-source", required: true },
    { path: "style-board.html", role: "human-preview", required: true },
    { path: "style-profile.json", role: "machine-measurements", required: true },
  ];
}

async function copyOptionalFile(source, root, relativePath, role, files) {
  if (!source) return;
  const destination = path.join(root, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
  files.push({ path: relativePath, role, required: false });
}

async function copyOptionalDirectory(source, root, relativePath, role, files) {
  if (!source) return;
  const destination = path.join(root, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true, errorOnExist: true });
  files.push({ path: relativePath, role, required: false });
}

function startHere({ packageName, packageId, manifest }) {
  const gaps = manifest.evidenceGaps.length
    ? manifest.evidenceGaps.map((gap) => `- ${gap}`).join("\n")
    : "- No evidence gaps were recorded in the measured profile.";
  return `# Start Here: ${packageName}

Package ID: \`${packageId}\`

This folder is a portable design-language package. It can be moved into another project or opened in a later AI session without the original chat history.

## Choose one entry point

| You are | Open |
| --- | --- |
| A designer or product owner | \`START-HERE.html\` |
| An AI Agent starting a new session | \`AGENT-HANDOFF.md\` |
| A developer reading the rules | \`STYLE.md\` |
| A tool or automated workflow | \`manifest.json\` and \`style-profile.json\` |

## Reuse in another session

Move this entire folder into the new project, then tell the Agent:

> Read \`AGENT-HANDOFF.md\` in this design package. Apply it to my new task, preserve the transfer boundaries, and do not re-extract the source website unless the package says evidence is missing.

The Agent should ask for or infer only the new audience, primary task, content, and owned assets. The reference-site conversation is not required.

## Files you can ignore initially

- \`advanced/\`: detailed design-system and icon material, when included.
- \`evidence/\`: raw browser evidence and screenshots, when included.

## Evidence gaps

${gaps}

## Rights boundary

This package transfers design rules, not ownership. Source branding, copy, photography, fonts, icons, campaign concepts, and other protected assets must be replaced unless separately licensed.
`;
}

function startHereHtml({ packageName, packageId, manifest }) {
  const safeName = escapeHtml(packageName);
  const safeId = escapeHtml(packageId);
  const safeSource = escapeHtml(manifest.source.url || "Not recorded");
  const prompt = "Read AGENT-HANDOFF.md in this design package. Apply it to my new task, preserve the transfer boundaries, and do not re-extract the source website unless the package says evidence is missing.";
  const gapItems = manifest.evidenceGaps.length
    ? manifest.evidenceGaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join("")
    : "<li>No evidence gaps were recorded in the measured profile.</li>";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safeName} - Start Here</title>
  <style>
    :root { color-scheme: light; --ink:#171717; --muted:#626267; --line:#d9d9de; --surface:#fff; --soft:#f5f5f7; --accent:#087f5b; }
    * { box-sizing:border-box; }
    body { margin:0; min-width:320px; color:var(--ink); background:var(--soft); font-family:system-ui,-apple-system,"Segoe UI",sans-serif; font-size:16px; line-height:1.5; letter-spacing:0; }
    main { width:min(920px,calc(100% - 32px)); margin:0 auto; padding:48px 0 64px; }
    header { padding-bottom:28px; border-bottom:1px solid var(--line); }
    .eyebrow { margin:0 0 8px; color:var(--accent); font-size:13px; font-weight:700; text-transform:uppercase; }
    h1 { margin:0; max-width:22ch; font-size:52px; line-height:1.08; letter-spacing:0; }
    .meta { margin:14px 0 0; color:var(--muted); overflow-wrap:anywhere; }
    .actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; }
    a,button { min-height:44px; padding:10px 16px; border:1px solid var(--ink); border-radius:6px; font:inherit; font-weight:650; cursor:pointer; }
    a { display:inline-flex; align-items:center; color:#fff; background:var(--ink); text-decoration:none; }
    button { color:var(--ink); background:var(--surface); }
    button:focus-visible,a:focus-visible { outline:3px solid color-mix(in srgb,var(--accent) 45%,transparent); outline-offset:3px; }
    .status { min-height:24px; margin:10px 0 0; color:var(--accent); font-size:14px; }
    section { padding:30px 0; border-bottom:1px solid var(--line); }
    h2 { margin:0 0 16px; font-size:22px; line-height:1.25; }
    .routes { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    article { padding:18px; border:1px solid var(--line); border-radius:8px; background:var(--surface); }
    article h3 { margin:0 0 6px; font-size:16px; }
    article p { margin:0; color:var(--muted); }
    code { padding:2px 5px; border-radius:4px; background:#e8e8eb; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em; }
    pre { margin:0; padding:16px; white-space:pre-wrap; overflow-wrap:anywhere; border:1px solid var(--line); border-radius:8px; background:var(--surface); font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace; }
    ul { margin:0; padding-left:22px; }
    .quiet { color:var(--muted); }
    @media (max-width:640px) { main{padding-top:28px}.routes{grid-template-columns:1fr}h1{font-size:36px}.actions{display:grid}.actions>*{justify-content:center;width:100%} }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Portable design-language package</p>
      <h1>${safeName}</h1>
      <p class="meta">Package <code>${safeId}</code> / Source ${safeSource}</p>
      <div class="actions">
        <a href="style-board.html">View style board</a>
        <button type="button" id="copyPrompt">Copy Agent prompt</button>
      </div>
      <p class="status" id="copyStatus" aria-live="polite"></p>
    </header>
    <section>
      <h2>Use the right entry point</h2>
      <div class="routes">
        <article><h3>New AI session</h3><p>Ask the Agent to read <code>AGENT-HANDOFF.md</code>.</p></article>
        <article><h3>Design review</h3><p>Open <code>style-board.html</code>.</p></article>
        <article><h3>Developer</h3><p>Read <code>STYLE.md</code>.</p></article>
        <article><h3>Automation</h3><p>Start from <code>manifest.json</code>.</p></article>
      </div>
    </section>
    <section>
      <h2>Cross-session prompt</h2>
      <pre id="promptText">${escapeHtml(prompt)}</pre>
    </section>
    <section>
      <h2>Evidence gaps</h2>
      <ul>${gapItems}</ul>
    </section>
    <section>
      <h2>Rights boundary</h2>
      <p class="quiet">This package transfers design rules, not ownership. Replace source branding, copy, photography, fonts, icons, and campaign concepts unless separately licensed.</p>
    </section>
  </main>
  <script>
    const button = document.getElementById("copyPrompt");
    const status = document.getElementById("copyStatus");
    button.addEventListener("click", async () => {
      const value = document.getElementById("promptText").textContent;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const area = document.createElement("textarea");
        area.value = value; document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
      }
      status.textContent = "Agent prompt copied.";
    });
  </script>
</body>
</html>
`;
}

function agentHandoff({ packageName, packageId, manifest }) {
  return `# Agent Handoff: ${packageName}

Package ID: \`${packageId}\`
Package type: \`website-design-language\`
Source reference: ${manifest.source.url ? `\`${manifest.source.url}\`` : "not recorded"}

## Session contract

This file is the only required entry point for a new AI session. The design package is already extracted and measured. Do not browse or re-extract the reference site unless the user requests a refresh or an evidence gap blocks the task.

## Read order

1. Read \`STYLE.md\` completely. It is the transferable design-language source of truth.
2. Read \`style-profile.json\` only when exact measurements, responsive values, or confidence need verification.
3. Open \`style-board.html\` when visual review is available.
4. Read \`advanced/\` only for implementation detail. Read \`evidence/\` only to audit a claim.

## Apply to the new task

Before implementation, identify:

- New audience.
- Primary user task or conversion goal.
- Required content and information architecture.
- Assets the user owns or is allowed to use.
- Target platforms and responsive conditions.

Then:

1. Preserve the measured hierarchy, rhythm, density, contrast, shape, imagery direction, motion restraint, and responsive transformations in \`STYLE.md\`.
2. Follow every \`retain / reinterpret / replace\` boundary.
3. Create an original structure for the new task. Do not reproduce the source page order by default.
4. Replace source branding, names, copy, icons, photography, fonts, and campaign concepts unless the user provides rights to them.
5. Validate desktop and mobile hierarchy, image framing, text fit, contrast, focus states, asset health, and adherence to \`STYLE.md\`.

## Response requirement

State which package ID was used, what was retained, what was reinterpreted, what was replaced, and any evidence limitation that affected the result.
`;
}

function escapeHtml(value) {
  return `${value ?? ""}`.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
