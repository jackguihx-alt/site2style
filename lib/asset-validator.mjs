import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "parse5";

const SKIPPED_PROTOCOLS = new Set(["data:", "blob:", "javascript:", "mailto:", "tel:", "about:"]);

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value ?? null;
}

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
  if (node.content) walk(node.content, visit);
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function locationOf(node) {
  const location = node.sourceCodeLocation;
  return location?.startLine ? `line ${location.startLine}:${location.startCol}` : "document";
}

function pathOrUrlToBase(value) {
  if (!value) return null;
  try {
    return new URL(value).href;
  } catch {
    return pathToFileURL(path.resolve(value)).href;
  }
}

export function parseSrcset(value) {
  const candidates = [];
  const input = `${value ?? ""}`;
  let index = 0;

  while (index < input.length) {
    while (index < input.length && /[\s,]/.test(input[index])) index += 1;
    if (index >= input.length) break;

    const start = index;
    const isDataUrl = input.slice(index, index + 5).toLowerCase() === "data:";
    while (
      index < input.length &&
      !/\s/.test(input[index]) &&
      (isDataUrl || input[index] !== ",")
    ) {
      index += 1;
    }

    const url = input.slice(start, index).trim();
    if (url) candidates.push(url);

    while (index < input.length && input[index] !== ",") index += 1;
    if (input[index] === ",") index += 1;
  }

  return candidates;
}

export function extractCssUrls(value) {
  const urls = [];
  const pattern = /url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/gi;
  for (const match of `${value ?? ""}`.matchAll(pattern)) {
    const url = (match[2] ?? match[3] ?? "").trim();
    if (url) urls.push(url);
  }
  return urls;
}

function pushReference(references, raw, kind, location, baseUrl) {
  if (raw == null || `${raw}`.trim() === "") return;
  references.push({ raw: `${raw}`.trim(), kind, location, baseUrl });
}

export function extractHtmlAssetReferences(html, options = {}) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const nodes = [];
  walk(document, (node) => nodes.push(node));

  const fallbackBase = pathOrUrlToBase(options.baseUrl || options.inputPath);
  const baseHref = nodes
    .filter((node) => node.tagName === "base")
    .map((node) => attr(node, "href"))
    .find(Boolean);
  let documentBase = fallbackBase;
  if (baseHref) {
    try {
      documentBase = new URL(baseHref, fallbackBase || undefined).href;
    } catch {
      documentBase = fallbackBase;
    }
  }

  const references = [];
  for (const node of nodes) {
    const tag = node.tagName;
    if (!tag) continue;
    const location = `${tag} at ${locationOf(node)}`;

    const srcTags = new Set(["img", "script", "iframe", "source", "video", "audio", "track", "embed", "input"]);
    if (srcTags.has(tag)) pushReference(references, attr(node, "src"), `${tag}:src`, location, documentBase);
    if (tag === "img" || tag === "source") {
      for (const url of parseSrcset(attr(node, "srcset"))) {
        pushReference(references, url, `${tag}:srcset`, location, documentBase);
      }
    }
    if (tag === "video") pushReference(references, attr(node, "poster"), "video:poster", location, documentBase);
    if (tag === "object") pushReference(references, attr(node, "data"), "object:data", location, documentBase);
    if (tag === "image" || tag === "use") {
      pushReference(references, attr(node, "href") || attr(node, "xlink:href"), `${tag}:href`, location, documentBase);
    }
    if (tag === "link") {
      const rel = (attr(node, "rel") || "").toLowerCase();
      const as = (attr(node, "as") || "").toLowerCase();
      if (/stylesheet|icon|preload|prefetch/.test(rel) && (!as || /image|font|style|script/.test(as))) {
        pushReference(references, attr(node, "href"), `link:${rel || "asset"}`, location, documentBase);
      }
      for (const url of parseSrcset(attr(node, "imagesrcset"))) {
        pushReference(references, url, "link:imagesrcset", location, documentBase);
      }
    }

    for (const url of extractCssUrls(attr(node, "style"))) {
      pushReference(references, url, `${tag}:style`, location, documentBase);
    }
    if (tag === "style") {
      for (const url of extractCssUrls(textContent(node))) {
        pushReference(references, url, "style:url", location, documentBase);
      }
    }
  }

  return { references, baseUrl: documentBase };
}

export function extractEvidenceAssetReferences(evidence, options = {}) {
  const references = [];
  const fallbackBase = pathOrUrlToBase(options.baseUrl || evidence.sourceUrl || options.inputPath);
  const pages = evidence.pages ?? {};

  for (const [pageName, page] of Object.entries(pages)) {
    const pageBase = pathOrUrlToBase(options.baseUrl || page.meta?.finalUrl || page.url || evidence.sourceUrl) || fallbackBase;
    const assets = page.assets ?? page;
    for (const [index, image] of (assets.images ?? []).entries()) {
      const location = `${pageName}.images[${index}]`;
      pushReference(references, image.src, "evidence:image-current", location, pageBase);
      pushReference(references, image.declaredSrc, "evidence:image-src", location, pageBase);
      for (const url of parseSrcset(image.srcset)) {
        pushReference(references, url, "evidence:image-srcset", location, pageBase);
      }
      for (const [sourceIndex, source] of (image.pictureSources ?? []).entries()) {
        for (const url of parseSrcset(source.srcset)) {
          pushReference(
            references,
            url,
            "evidence:picture-source",
            `${location}.pictureSources[${sourceIndex}]`,
            pageBase
          );
        }
      }
    }
    for (const [index, background] of (assets.backgrounds ?? []).entries()) {
      pushReference(references, background.url, "evidence:background", `${pageName}.backgrounds[${index}]`, pageBase);
    }
  }

  return { references, baseUrl: fallbackBase };
}

function normalizeReference(reference) {
  const raw = reference.raw.trim();
  if (!raw || raw.startsWith("#")) return { skipped: true, reason: "document-fragment" };

  const protocolMatch = raw.match(/^([a-z][a-z0-9+.-]*:)/i);
  if (protocolMatch && SKIPPED_PROTOCOLS.has(protocolMatch[1].toLowerCase())) {
    return { skipped: true, reason: protocolMatch[1].toLowerCase() };
  }

  try {
    const url = new URL(raw, reference.baseUrl || undefined);
    if (!new Set(["http:", "https:", "file:"]).has(url.protocol)) {
      return { skipped: true, reason: `unsupported-protocol:${url.protocol}` };
    }
    url.hash = "";
    return { url: url.href };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchAsset(url, options) {
  const headers = {
    "user-agent": options.userAgent,
    accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  };
  let response = null;
  let method = "HEAD";
  try {
    response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch {
    response = null;
  }

  if (!response?.ok) {
    await response?.body?.cancel().catch(() => {});
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { ...headers, range: "bytes=0-0" },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    method = "GET";
  }

  const result = {
    ok: response.ok,
    status: response.status,
    method,
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  };
  await response.body?.cancel().catch(() => {});
  return result;
}

async function checkAsset(url, options) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") {
      const details = await stat(fileURLToPath(parsed));
      return {
        ok: details.isFile(),
        status: details.isFile() ? 200 : 404,
        method: "FILE",
        finalUrl: url,
        contentType: null,
        contentLength: details.size,
      };
    }
    return await fetchAsset(url, options);
  } catch (error) {
    return {
      ok: false,
      status: null,
      method: null,
      finalUrl: url,
      contentType: null,
      contentLength: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function validateAssetReferences(references, options = {}) {
  const concurrency = Math.max(1, Math.min(32, Number(options.concurrency) || 8));
  const requestOptions = {
    timeoutMs: Math.max(250, Number(options.timeoutMs) || 10000),
    userAgent:
      options.userAgent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
  };
  const skipped = [];
  const invalid = [];
  const unique = new Map();

  for (const reference of references) {
    const normalized = normalizeReference(reference);
    if (normalized.skipped) {
      skipped.push({ ...reference, reason: normalized.reason });
      continue;
    }
    if (normalized.error) {
      invalid.push({
        url: reference.raw,
        ok: false,
        status: null,
        error: `Invalid asset URL: ${normalized.error}`,
        references: [reference],
      });
      continue;
    }
    const entry = unique.get(normalized.url) ?? { url: normalized.url, references: [] };
    entry.references.push(reference);
    unique.set(normalized.url, entry);
  }

  const entries = [...unique.values()];
  const checked = new Array(entries.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
    while (cursor < entries.length) {
      const index = cursor;
      cursor += 1;
      const result = await checkAsset(entries[index].url, requestOptions);
      checked[index] = { ...entries[index], ...result };
    }
  });
  await Promise.all(workers);

  const results = [...invalid, ...checked];
  const failed = results.filter((item) => !item.ok);
  return {
    passed: failed.length === 0,
    summary: {
      referenceCount: references.length,
      uniqueUrlCount: results.length,
      checked: checked.length,
      ok: results.length - failed.length,
      failed: failed.length,
      skipped: skipped.length,
    },
    results,
    skipped,
  };
}

export async function validateAssetSource(inputPath, options = {}) {
  const resolvedInput = path.resolve(inputPath);
  const content = await readFile(resolvedInput, "utf8");
  let extracted;
  let sourceType = "html";

  if (path.extname(resolvedInput).toLowerCase() === ".json") {
    sourceType = "evidence";
    extracted = extractEvidenceAssetReferences(JSON.parse(content), {
      ...options,
      inputPath: resolvedInput,
    });
  } else {
    extracted = extractHtmlAssetReferences(content, {
      ...options,
      inputPath: resolvedInput,
    });
  }

  const validation = await validateAssetReferences(extracted.references, options);
  return {
    inputPath: resolvedInput,
    sourceType,
    baseUrl: extracted.baseUrl,
    ...validation,
  };
}
