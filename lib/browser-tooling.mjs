import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isExecutable(filePath) {
  if (!filePath) return false;
  try {
    fs.accessSync(filePath, process.platform === "win32" ? fs.constants.F_OK : fs.constants.X_OK);
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function executableExtensions() {
  if (process.platform !== "win32") return [""];
  return (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM")
    .split(";")
    .filter(Boolean);
}

export function findOnPath(names) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = executableExtensions();

  for (const name of names) {
    if (path.isAbsolute(name) && isExecutable(name)) return name;
    for (const directory of pathEntries) {
      for (const extension of extensions) {
        const candidate = path.join(directory, process.platform === "win32" ? `${name}${extension}` : name);
        if (isExecutable(candidate)) return candidate;
      }
    }
  }
  return null;
}

function knownBrowserPaths() {
  const home = os.homedir();
  const candidates = [];

  if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      path.join(home, "Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    );
  }

  if (process.platform === "win32") {
    for (const root of [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]]) {
      if (!root) continue;
      candidates.push(
        path.join(root, "Google/Chrome/Application/chrome.exe"),
        path.join(root, "Chromium/Application/chrome.exe"),
        path.join(root, "Microsoft/Edge/Application/msedge.exe")
      );
    }
  }

  return candidates.filter(isExecutable);
}

function globalNodeModulesPath() {
  try {
    const result = spawnSync("npm", ["root", "-g"], { encoding: "utf8", timeout: 5000 });
    return result.status === 0 ? result.stdout.trim() : null;
  } catch {
    return null;
  }
}

function resolvePackage(packageName, roots) {
  for (const root of roots.filter(Boolean)) {
    try {
      const resolver = createRequire(path.join(root, "__website_to_design_resolver__.cjs"));
      return {
        packageName,
        entryPath: resolver.resolve(packageName),
        sourceRoot: root,
      };
    } catch {
      // Try the next search root.
    }
  }
  return null;
}

export function detectBrowserTooling(cwd = process.cwd()) {
  const globalModules = globalNodeModulesPath();
  const moduleRoots = [
    ...new Set([cwd, packageRoot, globalModules ? path.dirname(globalModules) : null].filter(Boolean)),
  ];
  const playwright =
    resolvePackage("playwright", moduleRoots) ||
    resolvePackage("playwright-core", moduleRoots);
  const pathBrowser = findOnPath([
    "google-chrome-stable",
    "google-chrome",
    "chrome",
    "chromium",
    "chromium-browser",
    "microsoft-edge",
    "msedge",
  ]);
  const chromeCandidates = [...new Set([pathBrowser, ...knownBrowserPaths()].filter(Boolean))];

  return {
    platform: process.platform,
    node: process.version,
    playwright,
    chromePath: chromeCandidates[0] || null,
    chromeCandidates,
    agentBrowserPath: findOnPath(["agent-browser"]),
  };
}

export function backendCandidates(tooling, preference = "auto") {
  const available = [
    tooling.playwright
      ? { backend: "playwright", path: tooling.playwright.entryPath }
      : null,
    tooling.chromePath
      ? { backend: "chrome-cli", path: tooling.chromePath }
      : null,
    tooling.agentBrowserPath
      ? { backend: "agent-browser", path: tooling.agentBrowserPath }
      : null,
  ].filter(Boolean);

  if (preference === "auto") return available;
  const aliases = { chrome: "chrome-cli", agent: "agent-browser" };
  const requested = aliases[preference] || preference;
  return available.filter((item) => item.backend === requested);
}

export function loadPlaywright(tooling) {
  if (!tooling.playwright) throw new Error("Playwright package was not detected");
  const resolver = createRequire(path.join(tooling.playwright.sourceRoot, "__website_to_design_loader__.cjs"));
  return resolver(tooling.playwright.packageName);
}

export function summarizeBrowserTooling(tooling) {
  return {
    platform: tooling.platform,
    node: tooling.node,
    ready: Boolean(tooling.playwright || tooling.chromePath || tooling.agentBrowserPath),
    recommendedBackend: backendCandidates(tooling)[0]?.backend || null,
    playwright: tooling.playwright
      ? { package: tooling.playwright.packageName, entryPath: tooling.playwright.entryPath }
      : null,
    chrome: tooling.chromePath,
    agentBrowser: tooling.agentBrowserPath,
  };
}
