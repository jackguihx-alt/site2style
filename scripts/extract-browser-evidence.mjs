#!/usr/bin/env node
/**
 * extract-browser-evidence.mjs — 浏览器证据提取脚本
 *
 * 支持三种提取后端并自动回退：
 *   1. Playwright npm package
 *   2. 系统 Chrome/Chromium/Edge + CDP
 *   3. agent-browser CLI（旧环境兼容）
 *
 * 三种后端执行相同的 styleProbe JS，产出结构一致的 JSON。
 *
 * 用法：node scripts/extract-browser-evidence.mjs <url> [outPath] [options]
 *
 * 选项：
 *   --headed    使用有头浏览器（非 headless），用于需要登录的场景。
 *               浏览器窗口会弹出，用户可手动登录，登录态保留在会话中。
 *              不加 --headed 时默认 headless。
 *   --no-screenshots  不保存响应式视口截图。
 *   --artifacts-dir   指定截图、素材清单和 SVG symbol 数据的目录。
 *   --profile         full（默认）/ standard / minimal。
 *   --backend         auto（默认）/ playwright / chrome / agent-browser。
 *   --login-wait      有头模式打开后等待用户登录的秒数。
 *
 * 本脚本不依赖任何特定 Agent。需要登录时使用 --headed，在弹出的浏览器中手动登录。
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { backendCandidates, detectBrowserTooling, loadPlaywright } from "../lib/browser-tooling.mjs";
import { resolveViewportProfile } from "../lib/viewports.mjs";

const cli = parseCliArgs(process.argv.slice(2));
const url = cli.positionals[0];
const outPath = cli.positionals[1];
const headed = cli.headed;
const loginWaitMs = cli.loginWaitSeconds * 1000;

if (!url) {
  console.error("Usage: node scripts/extract-browser-evidence.mjs <url> [outPath] [--headed] [--login-wait seconds] [--no-screenshots] [--artifacts-dir <dir>] [--profile full|standard|minimal] [--backend auto|playwright|chrome|agent-browser]");
  process.exit(1);
}

const targetCwd = process.cwd();
const outFile = outPath
  ? path.resolve(targetCwd, outPath)
  : path.join(os.tmpdir(), `website-design-evidence-${Date.now()}.json`);
const artifactsDir = path.resolve(
  targetCwd,
  cli.artifactsDir || path.join(path.dirname(outFile), `${path.basename(outFile, path.extname(outFile))}-artifacts`)
);
const captureScreenshots = !cli.noScreenshots;

const viewports = resolveViewportProfile(cli.profile);

const mobileUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function parseCliArgs(argv) {
  const parsed = {
    positionals: [],
    headed: false,
    noScreenshots: false,
    artifactsDir: null,
    profile: "full",
    backend: "auto",
    loginWaitSeconds: 0,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--headed") {
      parsed.headed = true;
    } else if (value === "--no-screenshots") {
      parsed.noScreenshots = true;
    } else if (value === "--artifacts-dir") {
      parsed.artifactsDir = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--artifacts-dir=")) {
      parsed.artifactsDir = value.slice("--artifacts-dir=".length);
    } else if (value === "--profile") {
      parsed.profile = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--profile=")) {
      parsed.profile = value.slice("--profile=".length);
    } else if (value === "--backend") {
      parsed.backend = argv[index + 1];
      index += 1;
    } else if (value.startsWith("--backend=")) {
      parsed.backend = value.slice("--backend=".length);
    } else if (value === "--login-wait") {
      parsed.loginWaitSeconds = Number(argv[index + 1]);
      index += 1;
    } else if (value.startsWith("--login-wait=")) {
      parsed.loginWaitSeconds = Number(value.slice("--login-wait=".length));
    } else if (value.startsWith("--")) {
      throw new Error(`Unknown option: ${value}`);
    } else {
      parsed.positionals.push(value);
    }
  }
  if (parsed.artifactsDir === true || parsed.artifactsDir === undefined) {
    throw new Error("--artifacts-dir requires a directory path");
  }
  if (!parsed.profile) throw new Error("--profile requires a value");
  if (!parsed.backend) throw new Error("--backend requires a value");
  if (!Number.isFinite(parsed.loginWaitSeconds) || parsed.loginWaitSeconds < 0) {
    throw new Error("--login-wait must be a non-negative number of seconds");
  }
  return parsed;
}

const styleProbe = `
  (() => {
    const clean = (value) => String(value?.baseVal ?? value ?? "").replace(/\\s+/g, " ").trim();
    const isVisible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const truncate = (value, limit = 4000) => {
      const text = value || "";
      return text.length > limit ? text.slice(0, limit) + "\\n<!-- truncated -->" : text;
    };
    const attrsOf = (el) => {
      if (!el) return {};
      return Object.fromEntries(
        [...el.attributes]
          .slice(0, 24)
          .map((attr) => [attr.name, clean(attr.value).slice(0, 300)])
      );
    };
    const styleOf = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: clean(el.textContent).slice(0, 160),
        className: clean(el.className).slice(0, 200),
        x: Math.round(rect.x),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        textDecoration: s.textDecorationLine,
        padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(" "),
        margin: [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].join(" "),
        gap: s.gap,
        display: s.display,
        position: s.position,
        html: truncate(el.outerHTML, 2400),
        attrs: attrsOf(el),
      };
    };
    const collectCssVariables = (style) =>
      [...style]
        .filter((name) => name.startsWith("--"))
        .reduce((acc, name) => {
          const value = clean(style.getPropertyValue(name));
          if (value) acc[name] = value;
          return acc;
        }, {});
    const readableCssRules = () => {
      const sheets = [];
      for (const sheet of [...document.styleSheets].slice(0, 40)) {
        const entry = {
          href: sheet.href || null,
          ownerNode: sheet.ownerNode?.tagName?.toLowerCase() || null,
          rules: [],
          inaccessible: false,
        };
        try {
          const rules = [...sheet.cssRules].slice(0, 80);
          entry.rules = rules.map((rule) => clean(rule.cssText).slice(0, 700));
        } catch {
          entry.inaccessible = true;
        }
        sheets.push(entry);
      }
      return sheets;
    };
    const sampleKeyNodes = (selector, limit = 8) =>
      [...document.querySelectorAll(selector)]
        .filter(isVisible)
        .slice(0, limit)
        .map((el) => ({
          selector,
          ...styleOf(el),
        }));
    const sampleVisible = (selector, limit = 12) =>
      [...document.querySelectorAll(selector)]
        .filter(isVisible)
        .slice(0, limit)
        .map(styleOf);
    const nav = [...document.querySelectorAll("header, nav")].find(isVisible);
    const footer = [...document.querySelectorAll("footer")].find(isVisible);
    const heroHeading = [...document.querySelectorAll("h1")].find(isVisible);
    const heroText = heroHeading?.closest("section, div");
    const cards = [...document.querySelectorAll("section div, li, article")]
      .filter((el) => isVisible(el) && /border|shadow|rounded|card/i.test(el.className || ""))
      .slice(0, 8)
      .map(styleOf);
    const headings = sampleVisible("h1, h2, h3", 16);
    const buttons = sampleVisible("button, a", 20).filter((item) => item.text && item.text.length < 80);
    const sections = [...document.querySelectorAll("main > *, section")]
      .filter(isVisible)
      .slice(0, 16)
      .map((el) => {
        const s = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: clean(el.textContent).slice(0, 120),
          backgroundColor: s.backgroundColor,
          borderColor: s.borderColor,
          minHeight: s.minHeight,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom,
          html: truncate(el.outerHTML, 2600),
        };
      });
    const dom = {
      htmlLang: document.documentElement.lang || null,
      bodyClass: clean(document.body.className),
      bodyAttributes: attrsOf(document.body),
      rootVariables: collectCssVariables(getComputedStyle(document.documentElement)),
      bodyVariables: collectCssVariables(getComputedStyle(document.body)),
      inlineStyles: [...document.querySelectorAll("style")]
        .slice(0, 24)
        .map((node) => truncate(node.textContent, 2400)),
      styleSheets: readableCssRules(),
      headHtml: truncate(document.head.innerHTML, 10000),
      bodyHtmlStart: truncate(document.body.innerHTML, 12000),
      mainHtml: truncate(document.querySelector("main")?.outerHTML || "", 16000),
      keyNodes: {
        header: sampleKeyNodes("header, nav", 4),
        headings: sampleKeyNodes("h1, h2, h3", 12),
        buttons: sampleKeyNodes("button, a", 16),
        cards: sampleKeyNodes("article, [class*='card'], [class*='panel']", 12),
      },
    };
    const fonts = [...new Set(
      [...document.querySelectorAll("body, body *")]
        .slice(0, 600)
        .map((el) => getComputedStyle(el).fontFamily)
        .filter(Boolean)
    )];
    const colors = [...new Set(
      [...document.querySelectorAll("body, body *")]
        .slice(0, 400)
        .flatMap((el) => {
          const s = getComputedStyle(el);
          return [s.color, s.backgroundColor, s.borderColor];
        })
        .filter((value) => value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent")
    )].slice(0, 60);
    const textSnippets = [...document.querySelectorAll("h1, h2, h3, p, a, button, span")]
      .filter(isVisible)
      .map((el) => clean(el.textContent))
      .filter(Boolean)
      .slice(0, 80);
    const selectorHint = (el) => {
      if (el.id) return "#" + CSS.escape(el.id);
      const testId = el.getAttribute("data-testid") || el.getAttribute("data-test-id");
      if (testId) return "[data-testid=" + CSS.escape(testId) + "]";
      const classes = [...el.classList].slice(0, 3).map((name) => "." + CSS.escape(name)).join("");
      return el.tagName.toLowerCase() + classes;
    };
    const rectOf = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const elementIdentity = (el) => {
      if (!el) return null;
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: clean(el.className).slice(0, 240),
        role: el.getAttribute("role"),
        ariaLabel: clean(el.getAttribute("aria-label")).slice(0, 180) || null,
        selector: selectorHint(el),
        geometry: rectOf(el),
      };
    };
    const pictureSourcesOf = (picture) => {
      if (!picture) return [];
      const unique = new Map();
      for (const source of [...picture.querySelectorAll("source")]) {
        const entry = {
          media: source.getAttribute("media"),
          srcset: source.getAttribute("srcset"),
          sizes: source.getAttribute("sizes"),
          type: source.getAttribute("type"),
        };
        const key = [entry.media, entry.srcset, entry.sizes, entry.type].join("|");
        if (!unique.has(key)) unique.set(key, entry);
      }
      return [...unique.values()];
    };
    const sourceModeOf = (value) => {
      const match = clean(value).match(/_(largetall|mediumtall|large|medium|small)(?:_2x)?\\.[a-z0-9]+(?:[?#]|$)/i);
      return match ? match[1].toLowerCase() : null;
    };
    const placeholderInfoOf = (img, source) => {
      const reasons = [];
      if (/^data:image\\/(?:gif|png);base64,/i.test(source || "") && img.naturalWidth <= 2 && img.naturalHeight <= 2) {
        reasons.push("tiny-inline-image");
      }
      if (/(?:placeholder|spacer|transparent|empty)(?:[._-]|$)/i.test(source || "")) {
        reasons.push("placeholder-like-name");
      }
      if (img.complete && (!img.naturalWidth || !img.naturalHeight)) {
        reasons.push("missing-intrinsic-size");
      }
      return { suspected: reasons.length > 0, reasons };
    };
    const galleryAttributeSelector = [
      "[role='tabpanel']",
      "[data-ac-gallery-item]",
      "[data-media-gallery-item]",
      "[data-gallery-item]",
    ].join(", ");
    const isGalleryItem = (element) =>
      element.matches(galleryAttributeSelector) ||
      [...element.classList].some((name) => /(?:^|[-_])(gallery|carousel|slider)[-_]item$/i.test(name));
    const closestGalleryItem = (element) => {
      let current = element.parentElement;
      while (current) {
        if (isGalleryItem(current)) return current;
        current = current.parentElement;
      }
      return null;
    };
    const ownershipSelector = [
      "li[role='tabpanel']",
      "[role='tabpanel']",
      "[data-ac-gallery-item]",
      "[data-media-gallery-item]",
      "[data-gallery-item]",
      "[class*='tile']",
      "[class*='card']",
      "article",
      "section",
    ].join(", ");
    const imageAssets = [...document.querySelectorAll("img")].map((img) => {
      const rect = img.getBoundingClientRect();
      const picture = img.closest("picture");
      const source = img.currentSrc || img.src || null;
      const owner = closestGalleryItem(img) || img.closest(ownershipSelector);
      return {
        src: source,
        declaredSrc: img.getAttribute("src"),
        srcset: img.getAttribute("srcset"),
        sizes: img.getAttribute("sizes"),
        alt: img.alt || "",
        loading: img.loading || null,
        complete: img.complete,
        sourceMode: sourceModeOf(source),
        placeholder: placeholderInfoOf(img, source),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        naturalWidth: img.naturalWidth || null,
        naturalHeight: img.naturalHeight || null,
        renderedGeometry: rectOf(img),
        intrinsicGeometry: {
          width: img.naturalWidth || null,
          height: img.naturalHeight || null,
        },
        picture: elementIdentity(picture),
        owner: elementIdentity(owner),
        selector: selectorHint(img),
        pictureSources: pictureSourcesOf(picture),
      };
    });
    const galleryNodes = [...document.querySelectorAll("body *")].filter(isGalleryItem);
    const galleryItems = galleryNodes.map((item, index) => ({
      index,
      ...elementIdentity(item),
      ariaHidden: item.getAttribute("aria-hidden"),
      hidden: item.hidden,
      text: clean(item.textContent).slice(0, 240),
      images: [...item.querySelectorAll("img")].map((img) => {
        const source = img.currentSrc || img.src || null;
        return {
          src: source,
          alt: img.alt || "",
          sourceMode: sourceModeOf(source),
          placeholder: placeholderInfoOf(img, source),
          renderedGeometry: rectOf(img),
          intrinsicGeometry: {
            width: img.naturalWidth || null,
            height: img.naturalHeight || null,
          },
        };
      }),
      controls: [...item.querySelectorAll("a, button, [role='button']")]
        .slice(0, 8)
        .map((control) => ({
          tag: control.tagName.toLowerCase(),
          label: clean(control.getAttribute("aria-label") || control.textContent).slice(0, 120),
          href: control.getAttribute("href"),
        })),
    }));
    const mainRoot = document.querySelector("main") || document.body;
    const topLevelStructure = [...mainRoot.children]
      .filter((el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE")
      .map((el, index) => {
        const heading = el.matches("h1, h2, h3") ? el : el.querySelector("h1, h2, h3");
        return {
          index,
          ...elementIdentity(el),
          heading: heading ? clean(heading.textContent).slice(0, 200) : null,
          text: clean(el.textContent).slice(0, 260),
          imageCount: el.querySelectorAll("img").length,
          pictureCount: el.querySelectorAll("picture").length,
          interactiveCount: el.querySelectorAll("a, button, [role='button'], input, select, summary").length,
          galleryItemCount: galleryNodes.filter((item) => el.contains(item)).length,
        };
      });
    const footerRoot = document.querySelector("footer");
    const directFooterHeading = (element) =>
      [...element.children].find((child) => child.matches("h2, h3, h4, h5, h6, summary, button")) || null;
    const footerCandidates = footerRoot
      ? [...footerRoot.querySelectorAll("*")].filter((element) => {
          if (!isVisible(element)) return false;
          const tag = element.tagName.toLowerCase();
          const hasGroupToken = [...element.classList]
            .some((name) => /(?:^|[-_])(group|column|section)$/i.test(name));
          return (
            tag === "nav" ||
            tag === "details" ||
            element.getAttribute("role") === "navigation" ||
            hasGroupToken ||
            (tag === "section" && directFooterHeading(element))
          );
        })
      : [];
    const footerGroups = footerCandidates
      .filter((candidate) => !footerCandidates.some((other) => other !== candidate && candidate.contains(other)))
      .map((group, index) => {
        const heading = directFooterHeading(group) || group.querySelector("h2, h3, h4, h5, h6, summary");
        return {
          index,
          ...elementIdentity(group),
          heading: clean(
            heading?.getAttribute("aria-label") ||
            heading?.querySelector("[aria-label]")?.getAttribute("aria-label") ||
            heading?.textContent
          ).slice(0, 180) || null,
          text: clean(group.textContent).slice(0, 260),
          linkCount: group.querySelectorAll("a").length,
        };
      });
    const structuralInventory = {
      counts: {
        mainChildren: topLevelStructure.length,
        sections: document.querySelectorAll("section").length,
        articles: document.querySelectorAll("article").length,
        pictures: document.querySelectorAll("picture").length,
        images: document.querySelectorAll("img").length,
        svgs: document.querySelectorAll("svg").length,
        visibleSvgs: [...document.querySelectorAll("svg")].filter(isVisible).length,
        headings: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
        links: document.querySelectorAll("a").length,
        buttons: document.querySelectorAll("button, [role='button']").length,
        iconControls: [...document.querySelectorAll("a, button, [role='button']")]
          .filter((control) => isVisible(control) && control.querySelector("svg, [class*='icon']"))
          .length,
        galleryItems: galleryNodes.length,
        footerGroups: footerGroups.length,
      },
      topLevel: topLevelStructure,
      footer: footerRoot ? elementIdentity(footerRoot) : null,
      footerGroups,
    };
    const backgroundAssets = [];
    const seenBackgrounds = new Set();
    for (const el of [...document.querySelectorAll("body, body *")].slice(0, 2500)) {
      const value = getComputedStyle(el).backgroundImage;
      if (!value || value === "none") continue;
      const urls = [...value.matchAll(/url\\(["']?([^"')]+)["']?\\)/g)].map((match) => match[1]);
      for (const assetUrl of urls) {
        if (seenBackgrounds.has(assetUrl)) continue;
        seenBackgrounds.add(assetUrl);
        const rect = el.getBoundingClientRect();
        backgroundAssets.push({
          url: assetUrl,
          selector: selectorHint(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          backgroundSize: getComputedStyle(el).backgroundSize,
          backgroundPosition: getComputedStyle(el).backgroundPosition,
        });
      }
    }
    const svgSymbols = Object.fromEntries(
      [...document.querySelectorAll("symbol[id]")].map((symbol) => [
        symbol.id,
        {
          vb: symbol.getAttribute("viewBox") || "0 0 16 16",
          inner: symbol.innerHTML,
        },
      ])
    );
    const svgDefs = {};
    document.querySelectorAll("defs").forEach((defs) => {
      defs.querySelectorAll("linearGradient[id], radialGradient[id], pattern[id], clipPath[id], mask[id], filter[id]")
        .forEach((node) => { svgDefs[node.id] = node.outerHTML; });
    });
    const svgUses = [...document.querySelectorAll("svg use")].map((use) => {
      const svg = use.closest("svg");
      const rect = svg?.getBoundingClientRect();
      return {
        href: use.getAttribute("href") || use.getAttribute("xlink:href"),
        selector: svg ? selectorHint(svg) : null,
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        color: svg ? getComputedStyle(svg).color : null,
      };
    });
    const inlineSvgs = [...document.querySelectorAll("svg")]
      .filter((svg) => !svg.querySelector("symbol") && !svg.querySelector("use"))
      .slice(0, 300)
      .map((svg, index) => ({
        id: svg.id || "inline-svg-" + (index + 1),
        selector: selectorHint(svg),
        viewBox: svg.getAttribute("viewBox"),
        html: truncate(svg.outerHTML, 12000),
      }));
    const fontFaces = document.fonts
      ? [...document.fonts].map((font) => ({
          family: font.family,
          style: font.style,
          weight: font.weight,
          stretch: font.stretch,
          status: font.status,
        }))
      : [];
    const resourceEntries = performance.getEntriesByType("resource").map((entry) => ({
      url: entry.name,
      initiatorType: entry.initiatorType,
      transferSize: entry.transferSize || null,
      decodedBodySize: entry.decodedBodySize || null,
    }));
    const interactiveCandidates = [...document.querySelectorAll("a, button, [role='button'], input, select, summary")]
      .filter(isVisible)
      .slice(0, 24)
      .map((el) => ({
        label: clean(el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder")).slice(0, 100),
        selector: selectorHint(el),
        ...styleOf(el),
      }));

    return {
      title: document.title,
      url: location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY),
      },
      root: styleOf(document.documentElement),
      body: styleOf(document.body),
      nav: styleOf(nav),
      footer: styleOf(footer),
      heroHeading: styleOf(heroHeading),
      heroContainer: styleOf(heroText),
      headings,
      buttons,
      cards,
      sections,
      fonts,
      colors,
      textSnippets,
      interactiveCandidates,
      structure: structuralInventory,
      galleryItems,
      assets: {
        images: imageAssets,
        backgrounds: backgroundAssets,
        svg: {
          symbols: svgSymbols,
          defs: svgDefs,
          uses: svgUses,
          inline: inlineSvgs,
        },
        fonts: fontFaces,
        resources: resourceEntries,
      },
      dom,
      documentHeight: document.documentElement.scrollHeight,
      imageCount: document.querySelectorAll("img, picture, svg").length,
    };
  })()
`;

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

function lastNonEmptyLine(value) {
  return `${value ?? ""}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .pop() ?? "";
}

function parseJsonOutput(stdout, label = "JSON output") {
  const text = `${stdout ?? ""}`.trim();
  if (!text) {
    throw new Error(`${label} was empty`);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // keep scanning upward in case the CLI printed extra lines
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} was not valid JSON:\n${text.slice(-800)}`);
  }
}

function runAgentBrowser(agentBrowserPath, sessionId, args, options = {}) {
  const result = run(agentBrowserPath, ["--session", sessionId, ...args], {
    input: options.input,
  });

  if (!options.allowFailure && !result.ok) {
    const detail = result.stderr || result.stdout || `agent-browser ${args.join(" ")} failed`;
    throw new Error(detail);
  }

  return result;
}

async function evaluateAgentBrowserJson(agentBrowserPath, sessionId, expression) {
  const result = runAgentBrowser(agentBrowserPath, sessionId, ["eval", "--stdin"], {
    input: `${expression}\n`,
  });
  return parseJsonOutput(result.stdout, "agent-browser eval output");
}

async function evaluateAgentBrowserText(agentBrowserPath, sessionId, expression, options = {}) {
  const result = runAgentBrowser(agentBrowserPath, sessionId, ["eval", "--stdin"], {
    input: `${expression}\n`,
    allowFailure: options.allowFailure ?? false,
  });
  return lastNonEmptyLine(result.stdout);
}

async function scrollSweepAgentBrowser(agentBrowserPath, sessionId) {
  await evaluateAgentBrowserText(agentBrowserPath, sessionId, "window.scrollTo(0, 0); 'ok';", { allowFailure: true });
  runAgentBrowser(agentBrowserPath, sessionId, ["wait", "200"], { allowFailure: true });
  for (let index = 0; index < 12; index += 1) {
    runAgentBrowser(agentBrowserPath, sessionId, ["scroll", "down", "1200"], { allowFailure: true });
    runAgentBrowser(agentBrowserPath, sessionId, ["wait", "180"], { allowFailure: true });
  }
  await evaluateAgentBrowserText(agentBrowserPath, sessionId, "window.scrollTo(0, 0); 'ok';", { allowFailure: true });
  runAgentBrowser(agentBrowserPath, sessionId, ["wait", "300"], { allowFailure: true });
}

async function extractWithAgentBrowser(urlToRead, agentBrowserPath) {
  const sessionId = `website-design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    runAgentBrowser(agentBrowserPath, sessionId, ["open", urlToRead]);
    runAgentBrowser(agentBrowserPath, sessionId, ["wait", "--load", "networkidle"], { allowFailure: true });
    runAgentBrowser(agentBrowserPath, sessionId, ["wait", "1500"], { allowFailure: true });
    await scrollSweepAgentBrowser(agentBrowserPath, sessionId);

    const desktop = await evaluateAgentBrowserJson(agentBrowserPath, sessionId, `JSON.stringify(${styleProbe})`);
    const finalUrl =
      (await evaluateAgentBrowserText(agentBrowserPath, sessionId, "location.href", { allowFailure: true })) || urlToRead;
    const title =
      (await evaluateAgentBrowserText(agentBrowserPath, sessionId, "document.title", { allowFailure: true })) ||
      desktop.title ||
      "";

    desktop.title = title;
    desktop.meta = {
      finalUrl,
      contentLength: desktop.dom?.bodyHtmlStart?.length ?? null,
    };

    return {
      extractedAt: new Date().toISOString(),
      url: urlToRead,
      pages: {
        desktop,
      },
      interactions: {},
      tooling: {
        selectedTool: "agent-browser-eval",
        browserPath: agentBrowserPath,
        sessionId,
      },
    };
  } finally {
    runAgentBrowser(agentBrowserPath, sessionId, ["close"], { allowFailure: true });
  }
}

class CdpConnection {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 0;
    this.pending = new Map();
    this.openPromise = null;
  }

  async open() {
    if (this.ws) {
      return;
    }

    this.ws = new WebSocket(this.wsUrl);
    this.openPromise = new Promise((resolve, reject) => {
      const cleanup = () => {
        this.ws?.removeEventListener("open", onOpen);
        this.ws?.removeEventListener("error", onError);
      };
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      this.ws.addEventListener("open", onOpen, { once: true });
      this.ws.addEventListener("error", onError, { once: true });
    });

    this.ws.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data));
      if (!payload.id) {
        return;
      }
      const entry = this.pending.get(payload.id);
      if (!entry) {
        return;
      }
      this.pending.delete(payload.id);
      if (payload.error) {
        entry.reject(new Error(payload.error.message || "Unknown CDP error"));
        return;
      }
      entry.resolve(payload.result ?? {});
    });

    this.ws.addEventListener("close", () => {
      for (const [id, entry] of this.pending.entries()) {
        entry.reject(new Error(`CDP connection closed while waiting for message ${id}`));
      }
      this.pending.clear();
    });

    await this.openPromise;
  }

  async send(method, params = {}, sessionId = null, timeout = 30000) {
    await this.open();
    const id = ++this.nextId;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }

    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout for ${method}`));
      }, timeout);

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      this.ws.send(JSON.stringify(payload));
    });
  }

  async close() {
    if (!this.ws || this.ws.readyState >= WebSocket.CLOSING) {
      return;
    }
    this.ws.close();
    await sleep(50);
  }
}

async function waitForDevToolsPort(userDataDir, timeoutMs = 10000) {
  const portFile = path.join(userDataDir, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const content = await fsp.readFile(portFile, "utf8");
      const [port] = content.trim().split(/\r?\n/);
      if (port) {
        return port.trim();
      }
    } catch {
      // keep polling
    }
    await sleep(100);
  }

  throw new Error("Chrome DevTools port was not exposed in time");
}

function launchChrome(chromePath, headed = false) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "website-design-chrome-"));
  const headlessArgs = headed
    ? []
    : ["--headless=new", "--disable-gpu"];
  const args = [
    ...headlessArgs,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-sync",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ];

  if (headed) {
    console.log("有头模式：Chrome 窗口已弹出，需要登录时请手动操作。");
  }

  const proc = spawn(chromePath, args, {
    stdio: ["ignore", "ignore", "pipe"],
  });

  let stderr = "";
  proc.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  return {
    proc,
    userDataDir,
    getStderr: () => stderr,
  };
}

async function killChrome(proc, userDataDir) {
  if (proc && proc.exitCode === null && !proc.killed) {
    proc.kill("SIGTERM");
    await sleep(250);
    if (proc.exitCode === null) {
      proc.kill("SIGKILL");
    }
  }

  if (userDataDir) {
    await fsp.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function waitForReadyState(conn, sessionId, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = await evaluateValue(conn, sessionId, "document.readyState");
      if (state === "complete") {
        return;
      }
    } catch {
      // continue polling
    }
    await sleep(250);
  }
}

async function evaluateValue(conn, sessionId, expression, timeout = 30000) {
  const result = await conn.send(
    "Runtime.evaluate",
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
    sessionId,
    timeout
  );

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
      result.result?.description ||
      result.exceptionDetails.text ||
      "Runtime.evaluate failed"
    );
  }

  return result.result?.value;
}

async function evaluateObject(conn, sessionId, expression, timeout = 30000) {
  return await evaluateValue(conn, sessionId, expression, timeout);
}

async function scrollSweepCdp(conn, sessionId) {
  await evaluateValue(conn, sessionId, "window.scrollTo(0, 0)");
  await sleep(200);
  for (let index = 0; index < 30; index += 1) {
    const state = await evaluateValue(conn, sessionId, `({
      y: window.scrollY,
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight
    })`);
    if (state.y + state.viewport >= state.height - 2) break;
    await evaluateValue(conn, sessionId, `window.scrollTo(0, Math.min(${state.height}, window.scrollY + Math.max(window.innerHeight * 0.85, 700)))`);
    await sleep(180);
  }
  await evaluateValue(conn, sessionId, "window.scrollTo(0, 0)");
  await evaluateValue(conn, sessionId, `(async () => {
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map((img) => new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }));
    await Promise.race([Promise.all(pending), new Promise((resolve) => setTimeout(resolve, 5000))]);
    return pending.length;
  })()`, 7000);
  await sleep(300);
}

async function scrollSweepPlaywright(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  for (let index = 0; index < 30; index += 1) {
    const state = await page.evaluate(() => ({
      y: window.scrollY,
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    }));
    if (state.y + state.viewport >= state.height - 2) break;
    await page.evaluate(() => window.scrollTo(0, Math.min(document.documentElement.scrollHeight, window.scrollY + Math.max(window.innerHeight * 0.85, 700))));
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(async () => {
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map((img) => new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }));
    await Promise.race([Promise.all(pending), new Promise((resolve) => setTimeout(resolve, 5000))]);
  });
  await page.waitForTimeout(300);
}

function hoverProbe(candidate) {
  return `(() => {
    const clean = (value) => String(value?.baseVal ?? value ?? "").replace(/\\s+/g, " ").trim();
    const isVisible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const styleOf = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        text: clean(el.textContent),
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        boxShadow: s.boxShadow,
        transform: s.transform,
      };
    };
    const candidate = ${JSON.stringify(candidate)};
    let target = null;
    try { target = document.querySelector(candidate.selector); } catch {}
    if (!isVisible(target) && candidate.label) {
      target = [...document.querySelectorAll("a, button, [role='button'], input, select, summary")]
        .find((el) => isVisible(el) && clean(el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder")).includes(candidate.label));
    }
    if (!target) return null;
    target.scrollIntoView({ block: "center", inline: "center" });
    const rect = target.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      style: styleOf(target),
    };
  })()`;
}

async function hoverStateCdp(conn, sessionId, candidate) {
  const before = await evaluateObject(conn, sessionId, hoverProbe(candidate));
  if (!before) {
    return null;
  }

  await conn.send(
    "Input.dispatchMouseEvent",
    { type: "mouseMoved", x: before.x, y: before.y, button: "none" },
    sessionId
  );
  await sleep(150);

  const after = await evaluateObject(conn, sessionId, hoverProbe(candidate));
  return {
    label: candidate.label,
    selector: candidate.selector,
    before: before.style,
    after: after?.style ?? before.style,
  };
}

async function captureViewportCdp(conn, sessionId, viewportName) {
  if (!captureScreenshots) return null;
  const screenshotPath = path.join(artifactsDir, `${viewportName}.png`);
  const result = await conn.send(
    "Page.captureScreenshot",
    { format: "png", fromSurface: true, captureBeyondViewport: false },
    sessionId,
    60000
  );
  await fsp.writeFile(screenshotPath, result.data, "base64");
  return path.relative(path.dirname(outFile), screenshotPath).split(path.sep).join("/");
}

async function extractWithChrome(urlToRead, chromePath, headed = false) {
  const launched = launchChrome(chromePath, headed);
  let conn = null;

  try {
    const port = await waitForDevToolsPort(launched.userDataDir);
    const versionInfo = await fetch(`http://127.0.0.1:${port}/json/version`).then((res) => res.json());
    conn = new CdpConnection(versionInfo.webSocketDebuggerUrl);
    await conn.open();

    const results = {
      extractedAt: new Date().toISOString(),
      url: urlToRead,
      pages: {},
      interactions: {},
      tooling: {
        selectedTool: "chrome-cli",
        browserPath: chromePath,
      },
    };

    for (const viewport of viewports) {
      const { targetId } = await conn.send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await conn.send("Target.attachToTarget", { targetId, flatten: true });

      await conn.send("Page.enable", {}, sessionId);
      await conn.send("Runtime.enable", {}, sessionId);
      await conn.send("Network.enable", {}, sessionId);
      await conn.send(
        "Emulation.setDeviceMetricsOverride",
        {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
          mobile: Boolean(viewport.isMobile),
        },
        sessionId
      );

      if (viewport.isMobile) {
        await conn.send(
          "Network.setUserAgentOverride",
          {
            userAgent: mobileUserAgent,
          },
          sessionId
        );
        await conn.send(
          "Emulation.setTouchEmulationEnabled",
          { enabled: true, maxTouchPoints: 5 },
          sessionId
        );
      }

      await conn.send("Page.navigate", { url: urlToRead }, sessionId, 120000);
      await waitForReadyState(conn, sessionId, 60000);
      if (headed && viewport === viewports[0] && loginWaitMs > 0) {
        console.log(`等待 ${cli.loginWaitSeconds} 秒，请在浏览器窗口完成登录或页面准备。`);
        await sleep(loginWaitMs);
        await waitForReadyState(conn, sessionId, 60000);
      }
      await sleep(1800);
      await scrollSweepCdp(conn, sessionId);

      results.pages[viewport.name] = await evaluateObject(conn, sessionId, styleProbe, 60000);
      results.pages[viewport.name].meta = {
        finalUrl: await evaluateValue(conn, sessionId, "location.href"),
        contentLength: await evaluateValue(conn, sessionId, "document.documentElement.outerHTML.length"),
      };
      results.pages[viewport.name].screenshot = await captureViewportCdp(conn, sessionId, viewport.name);

      if (viewport.name === "desktop") {
        const candidates = results.pages[viewport.name].interactiveCandidates.slice(0, 8);
        results.interactions.hover = [];
        for (const candidate of candidates) {
          const state = await hoverStateCdp(conn, sessionId, candidate).catch(() => null);
          if (state) results.interactions.hover.push(state);
        }
      }

      await conn.send("Target.closeTarget", { targetId });
    }

    return results;
  } catch (error) {
    const stderr = launched.getStderr();
    const detail = stderr ? `${error.message}\n${stderr}` : error.message;
    throw new Error(`Chrome extraction failed: ${detail}`);
  } finally {
    if (conn) {
      await conn.close().catch(() => {});
    }
    await killChrome(launched.proc, launched.userDataDir);
  }
}

async function hoverStatePlaywright(page, candidate) {
  let locator;
  try {
    locator = page.locator(candidate.selector).first();
    if ((await locator.count()) === 0 && candidate.label) {
      locator = page
        .locator("a:visible, button:visible, [role='button']:visible, input:visible, select:visible, summary:visible")
        .filter({ hasText: candidate.label })
        .first();
    }
  } catch {
    return null;
  }
  if ((await locator.count()) === 0) {
    return null;
  }

  const getStyle = async () =>
    locator.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        boxShadow: s.boxShadow,
        transform: s.transform,
      };
    });

  const before = await getStyle();
  await locator.scrollIntoViewIfNeeded();
  let after = before;
  try {
    await locator.hover();
    await page.waitForTimeout(150);
    after = await getStyle();
  } catch {
    after = before;
  }

  return { label: candidate.label, selector: candidate.selector, before, after };
}

async function extractWithPlaywright(urlToRead, tooling, headed = false) {
  const { chromium } = loadPlaywright(tooling);
  const launchOptions = { headless: !headed };
  if (tooling.chromePath) launchOptions.executablePath = tooling.chromePath;
  const browser = await chromium.launch(launchOptions);

  if (headed) {
    console.log("有头模式：浏览器窗口已弹出，需要登录时请手动操作。");
  }

  try {
    const results = {
      extractedAt: new Date().toISOString(),
      url: urlToRead,
      pages: {},
      interactions: {},
      tooling: {
        selectedTool: "playwright",
      },
    };

    let storageState;
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile ?? false,
        hasTouch: viewport.hasTouch ?? false,
        userAgent: viewport.isMobile ? mobileUserAgent : undefined,
        storageState,
      });

      const page = await context.newPage();
      await page.goto(urlToRead, { waitUntil: "domcontentloaded", timeout: 120000 });
      if (headed && viewport === viewports[0] && loginWaitMs > 0) {
        console.log(`等待 ${cli.loginWaitSeconds} 秒，请在浏览器窗口完成登录或页面准备。`);
        await page.waitForTimeout(loginWaitMs);
        storageState = await context.storageState();
      }
      await page.waitForTimeout(1800);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await scrollSweepPlaywright(page);

      results.pages[viewport.name] = await page.evaluate(styleProbe);
      results.pages[viewport.name].meta = {
        finalUrl: page.url(),
        contentLength: (await page.content()).length,
      };
      if (captureScreenshots) {
        const screenshotPath = path.join(artifactsDir, `${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        results.pages[viewport.name].screenshot = path
          .relative(path.dirname(outFile), screenshotPath)
          .split(path.sep)
          .join("/");
      } else {
        results.pages[viewport.name].screenshot = null;
      }

      if (viewport.name === "desktop") {
        results.interactions.hover = [];
        for (const candidate of results.pages[viewport.name].interactiveCandidates.slice(0, 8)) {
          const state = await hoverStatePlaywright(page, candidate).catch(() => null);
          if (state) results.interactions.hover.push(state);
        }
      }

      await context.close();
    }

    return results;
  } finally {
    await browser.close();
  }
}

async function main() {
  const tooling = detectBrowserTooling(targetCwd);
  const candidates = backendCandidates(tooling, cli.backend);

  if (!candidates.length) {
    throw new Error(
      "No browser extraction backend available. Install one of:\n" +
      "  1. npm install && npx playwright install chromium\n" +
      "  2. Google Chrome, Chromium, or Microsoft Edge\n" +
      "  3. agent-browser CLI (legacy)\n\n" +
      "Run `site2style doctor` to inspect this machine."
    );
  }

  if (headed) {
    console.log("模式: 有头（非 headless）——需要登录时请在弹出的浏览器窗口手动操作。");
  }

  await ensureDir(outFile);
  await fsp.mkdir(artifactsDir, { recursive: true });

  let results = null;
  let backend = null;
  const backendErrors = [];
  for (const candidate of candidates) {
    try {
      console.log(`Trying backend: ${candidate.backend} (${candidate.path})`);
      switch (candidate.backend) {
        case "playwright":
          results = await extractWithPlaywright(url, tooling, headed);
          break;
        case "chrome-cli":
          results = await extractWithChrome(url, candidate.path, headed);
          break;
        case "agent-browser":
          results = await extractWithAgentBrowser(url, candidate.path);
          break;
        default:
          throw new Error(`Unknown backend: ${candidate.backend}`);
      }
      backend = candidate;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      backendErrors.push({ backend: candidate.backend, message });
      if (cli.backend !== "auto") throw error;
      console.error(`Backend ${candidate.backend} failed; trying the next available backend.\n${message}`);
    }
  }

  if (!results || !backend) {
    throw new Error(`All browser extraction backends failed:\n${backendErrors.map((item) => `- ${item.backend}: ${item.message}`).join("\n")}`);
  }

  console.log(`Selected backend: ${backend.backend} (${backend.path})`);

  results.tooling = {
    ...(results.tooling ?? {}),
    selectedBackend: backend.backend,
    backendPath: backend.path,
    attemptedBackends: candidates.map((candidate) => candidate.backend),
    backendErrors,
    viewportProfile: cli.profile,
    allDetected: {
      playwright: tooling.playwright?.entryPath || null,
      chrome: tooling.chromePath,
      agentBrowser: tooling.agentBrowserPath,
    },
  };

  const assetManifest = {
    sourceUrl: url,
    extractedAt: results.extractedAt,
    pages: Object.fromEntries(
      Object.entries(results.pages).map(([name, page]) => [name, {
        url: page.meta?.finalUrl || page.url,
        viewport: page.viewport,
        screenshot: page.screenshot || null,
        images: page.assets?.images || [],
        backgrounds: page.assets?.backgrounds || [],
        fonts: page.assets?.fonts || [],
        resources: page.assets?.resources || [],
        svgUseCount: page.assets?.svg?.uses?.length || 0,
        inlineSvgCount: page.assets?.svg?.inline?.length || 0,
        symbolCount: Object.keys(page.assets?.svg?.symbols || {}).length,
      }])
    ),
  };
  const manifestPath = path.join(artifactsDir, "asset-manifest.json");
  await fsp.writeFile(manifestPath, JSON.stringify(assetManifest, null, 2));

  const desktopSvg = results.pages.desktop?.assets?.svg;
  if (desktopSvg && Object.keys(desktopSvg.symbols || {}).length) {
    await fsp.writeFile(
      path.join(artifactsDir, "svg-symbols.json"),
      JSON.stringify({ symbols: desktopSvg.symbols, defs: desktopSvg.defs || {} }, null, 2)
    );
  }

  results.artifacts = {
    directory: path.relative(path.dirname(outFile), artifactsDir).split(path.sep).join("/"),
    assetManifest: path.relative(path.dirname(outFile), manifestPath).split(path.sep).join("/"),
    svgSymbols: desktopSvg && Object.keys(desktopSvg.symbols || {}).length
      ? path.relative(path.dirname(outFile), path.join(artifactsDir, "svg-symbols.json")).split(path.sep).join("/")
      : null,
  };
  await fsp.writeFile(outFile, JSON.stringify(results, null, 2));
  console.log(outFile);
}

await main();
