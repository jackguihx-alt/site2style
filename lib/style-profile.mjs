function clean(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function addCount(map, value, metadata = null) {
  const key = clean(value);
  if (!key || key === "none" || key === "normal" || key === "transparent" || key === "rgba(0, 0, 0, 0)") return;
  const entry = map.get(key) ?? { value: key, count: 0, examples: [] };
  entry.count += 1;
  if (metadata && entry.examples.length < 4 && !entry.examples.some((item) => JSON.stringify(item) === JSON.stringify(metadata))) {
    entry.examples.push(metadata);
  }
  map.set(key, entry);
}

function ranked(map, limit = 20) {
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit);
}

function countValues(values, limit = 20) {
  const map = new Map();
  for (const value of values) addCount(map, value);
  return ranked(map, limit);
}

function nodeSamples(page) {
  return [
    ["root", page.root],
    ["body", page.body],
    ["navigation", page.nav],
    ["footer", page.footer],
    ["hero-heading", page.heroHeading],
    ["hero-container", page.heroContainer],
    ...(page.headings ?? []).map((node) => ["heading", node]),
    ...(page.buttons ?? []).map((node) => ["control", node]),
    ...(page.cards ?? []).map((node) => ["card", node]),
  ].filter(([, node]) => node && typeof node === "object");
}

function typographyKey(node) {
  return [node.fontFamily, node.fontSize, node.fontWeight, node.lineHeight, node.letterSpacing]
    .map(clean)
    .join(" | ");
}

function aspectBucket(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return "unknown";
  const ratio = width / height;
  if (ratio >= 2.2) return "ultra-wide";
  if (ratio >= 1.2) return "landscape";
  if (ratio > 0.88) return "square";
  return "portrait";
}

function publicNodeStyle(role, node) {
  if (!node) return null;
  return {
    role,
    text: clean(node.text).slice(0, 140),
    fontFamily: node.fontFamily ?? null,
    fontSize: node.fontSize ?? null,
    fontWeight: node.fontWeight ?? null,
    lineHeight: node.lineHeight ?? null,
    letterSpacing: node.letterSpacing ?? null,
    color: node.color ?? null,
    backgroundColor: node.backgroundColor ?? null,
    borderRadius: node.borderRadius ?? null,
    width: node.width ?? null,
    height: node.height ?? null,
  };
}

function numericCssSize(value) {
  const parsed = Number.parseFloat(`${value ?? ""}`);
  return Number.isFinite(parsed) ? parsed : -1;
}

function displayHeading(page) {
  const candidates = [page.heroHeading, ...(page.headings ?? [])].filter((node) =>
    node
    && numericCssSize(node.fontSize) > 0
    && Number(node.width) > 1
    && Number(node.height) > 1
  );
  return candidates.sort((a, b) => numericCssSize(b.fontSize) - numericCssSize(a.fontSize))[0] ?? null;
}

function viewportNameMap(pages) {
  return Object.fromEntries(
    Object.entries(pages).map(([name, page]) => [name, {
      width: page.viewport?.width ?? null,
      height: page.viewport?.height ?? null,
      devicePixelRatio: page.viewport?.devicePixelRatio ?? null,
      colorScheme: page.viewport?.colorScheme ?? null,
      documentHeight: page.documentHeight ?? null,
      mainChildren: page.structure?.counts?.mainChildren ?? null,
      sections: page.structure?.counts?.sections ?? null,
      images: page.structure?.counts?.images ?? page.assets?.images?.length ?? null,
      links: page.structure?.counts?.links ?? null,
      buttons: page.structure?.counts?.buttons ?? null,
      heroHeading: publicNodeStyle("hero-heading", page.heroHeading),
      displayHeading: publicNodeStyle("display-heading", displayHeading(page)),
      navigation: publicNodeStyle("navigation", page.nav),
      selectedSourceModes: countValues((page.assets?.images ?? []).map((image) => image.sourceMode), 10),
    }])
  );
}

export function buildStyleProfile(evidence) {
  const pages = evidence.pages && typeof evidence.pages === "object" ? evidence.pages : {};
  const pageEntries = Object.entries(pages);
  if (!pageEntries.length) throw new Error("Evidence does not contain any captured pages");

  const colorMap = new Map();
  const fontMap = new Map();
  const typographyMap = new Map();
  const radiusMap = new Map();
  const shadowMap = new Map();
  const borderMap = new Map();
  const spacingMap = new Map();
  const sectionBackgroundMap = new Map();
  const sourceModeMap = new Map();
  const mediaConditionMap = new Map();
  const assetHostMap = new Map();
  const aspectMap = new Map();
  const roleSamples = {};
  const imageSamples = [];

  for (const [viewportName, page] of pageEntries) {
    for (const [role, node] of nodeSamples(page)) {
      const example = { viewport: viewportName, role, text: clean(node.text).slice(0, 80) };
      addCount(colorMap, node.color, example);
      addCount(colorMap, node.backgroundColor, example);
      addCount(colorMap, node.borderColor, example);
      addCount(fontMap, node.fontFamily, example);
      addCount(radiusMap, node.borderRadius, example);
      addCount(shadowMap, node.boxShadow, example);
      addCount(borderMap, node.borderColor, example);
      addCount(spacingMap, node.padding, example);
      addCount(spacingMap, node.margin, example);
      addCount(spacingMap, node.gap, example);

      const typeKey = typographyKey(node);
      if (typeKey.replace(/\|/g, "").trim()) {
        const entry = typographyMap.get(typeKey) ?? {
          value: typeKey,
          count: 0,
          fontFamily: node.fontFamily ?? null,
          fontSize: node.fontSize ?? null,
          fontWeight: node.fontWeight ?? null,
          lineHeight: node.lineHeight ?? null,
          letterSpacing: node.letterSpacing ?? null,
          examples: [],
        };
        entry.count += 1;
        if (entry.examples.length < 5) entry.examples.push(example);
        typographyMap.set(typeKey, entry);
      }

      roleSamples[role] ??= [];
      if (roleSamples[role].length < 12) roleSamples[role].push(publicNodeStyle(role, node));
    }

    for (const section of page.sections ?? []) {
      addCount(sectionBackgroundMap, section.backgroundColor, {
        viewport: viewportName,
        text: clean(section.text).slice(0, 80),
      });
      addCount(spacingMap, section.paddingTop, { viewport: viewportName, role: "section-padding-top" });
      addCount(spacingMap, section.paddingBottom, { viewport: viewportName, role: "section-padding-bottom" });
    }

    for (const image of page.assets?.images ?? []) {
      const geometry = image.renderedGeometry ?? { width: image.width, height: image.height };
      if (geometry?.width > 0 && geometry?.height > 0) {
        addCount(aspectMap, aspectBucket(geometry.width, geometry.height), {
          viewport: viewportName,
          alt: clean(image.alt).slice(0, 80),
        });
      }
      addCount(sourceModeMap, image.sourceMode, { viewport: viewportName });
      for (const source of image.pictureSources ?? []) addCount(mediaConditionMap, source.media || "default");
      try {
        if (image.src) addCount(assetHostMap, new URL(image.src).host);
      } catch {
        // Relative/local assets intentionally have no remote host.
      }
      if (geometry?.width > 0 && geometry?.height > 0 && imageSamples.length < 24) {
        imageSamples.push({
          viewport: viewportName,
          alt: clean(image.alt).slice(0, 100),
          src: image.src ?? null,
          sourceMode: image.sourceMode ?? null,
          renderedGeometry: geometry,
          ownerGeometry: image.owner?.geometry ?? null,
          intrinsicGeometry: image.intrinsicGeometry ?? {
            width: image.naturalWidth ?? null,
            height: image.naturalHeight ?? null,
          },
          pictureSourceCount: image.pictureSources?.length ?? 0,
        });
      }
    }
  }

  const [primaryViewportName, primaryPage] = pageEntries[0];
  const sectionSequence = (primaryPage.structure?.topLevel ?? []).map((section, index) => ({
    index,
    tag: section.tag ?? null,
    heading: clean(section.heading) || null,
    text: clean(section.text).slice(0, 140),
    geometry: section.geometry ?? null,
    imageCount: section.imageCount ?? null,
    interactiveCount: section.interactiveCount ?? null,
  }));

  const gaps = [];
  if (pageEntries.length < 3) gaps.push("Fewer than three responsive viewports were captured.");
  if (!fontMap.size) gaps.push("No computed font-family evidence was captured.");
  if (!colorMap.size) gaps.push("No computed color evidence was captured.");
  if (!imageSamples.length) gaps.push("No visible image geometry was captured.");
  if (!Object.keys(evidence.interactions ?? {}).length) gaps.push("No interaction-state evidence was captured.");

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      url: evidence.sourceUrl || evidence.url || primaryPage.meta?.finalUrl || primaryPage.url || null,
      capturedAt: evidence.extractedAt ?? null,
      primaryViewport: primaryViewportName,
      viewportCount: pageEntries.length,
      tooling: evidence.tooling?.selectedBackend ?? evidence.tooling?.backend ?? null,
    },
    viewports: viewportNameMap(pages),
    styleSignals: {
      colors: ranked(colorMap, 24),
      sectionBackgrounds: ranked(sectionBackgroundMap, 16),
      fontFamilies: ranked(fontMap, 12),
      typographyPatterns: [...typographyMap.values()]
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .slice(0, 24),
      radii: ranked(radiusMap, 16),
      shadows: ranked(shadowMap, 12),
      borders: ranked(borderMap, 12),
      spacing: ranked(spacingMap, 24),
    },
    composition: {
      primarySectionSequence: sectionSequence,
      roleSamples,
      documentHeights: Object.fromEntries(pageEntries.map(([name, page]) => [name, page.documentHeight ?? null])),
    },
    imagery: {
      visibleAspectRatios: ranked(aspectMap, 8),
      selectedSourceModes: ranked(sourceModeMap, 12),
      pictureMediaConditions: ranked(mediaConditionMap, 20),
      assetHosts: ranked(assetHostMap, 12),
      samples: imageSamples,
    },
    interactions: {
      capturedStates: Object.keys(evidence.interactions ?? {}),
      controlsByViewport: Object.fromEntries(pageEntries.map(([name, page]) => [name, {
        candidates: (page.interactiveCandidates ?? []).slice(0, 18).map((item) => ({
          label: clean(item.label).slice(0, 100),
          selector: item.selector ?? null,
          color: item.color ?? null,
          backgroundColor: item.backgroundColor ?? null,
          borderRadius: item.borderRadius ?? null,
        })),
      }])),
    },
    evidenceGaps: gaps,
  };
}

function markdownTable(headers, rows) {
  const safe = (value) => clean(value).replace(/\|/g, "\\|") || "-";
  return [
    `| ${headers.map(safe).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(safe).join(" | ")} |`),
  ].join("\n");
}

export function styleProfileToMarkdown(profile) {
  const viewportRows = Object.entries(profile.viewports).map(([name, viewport]) => [
    name,
    `${viewport.width ?? "?"} x ${viewport.height ?? "?"}`,
    viewport.documentHeight,
    viewport.displayHeading?.fontSize,
    viewport.navigation?.height,
    viewport.images,
  ]);
  const colorRows = profile.styleSignals.colors.slice(0, 16).map((item) => [
    item.value,
    item.count,
    item.examples.map((example) => `${example.role ?? "node"}@${example.viewport ?? "?"}`).join(", "),
  ]);
  const typographyRows = profile.styleSignals.typographyPatterns.slice(0, 16).map((item) => [
    item.fontFamily,
    item.fontSize,
    item.fontWeight,
    item.lineHeight,
    item.letterSpacing,
    item.count,
  ]);
  const sectionRows = profile.composition.primarySectionSequence.map((section) => [
    section.index,
    section.tag,
    section.heading || section.text,
    section.geometry ? `${section.geometry.width} x ${section.geometry.height}` : "-",
    section.imageCount,
    section.interactiveCount,
  ]);
  const mediaRows = profile.imagery.samples.slice(0, 16).map((item) => [
    item.viewport,
    item.alt || "unlabelled",
    item.sourceMode,
    item.renderedGeometry ? `${item.renderedGeometry.width} x ${item.renderedGeometry.height}` : "-",
    item.ownerGeometry ? `${item.ownerGeometry.width} x ${item.ownerGeometry.height}` : "-",
    item.pictureSourceCount,
  ]);

  return `# STYLE Measurements\n\n` +
    `> Deterministic style evidence generated from browser extraction. An Agent should synthesize the transferable rules; do not treat frequency alone as design intent.\n\n` +
    `## Source\n\n` +
    `- URL: ${profile.source.url ?? "unknown"}\n` +
    `- Captured: ${profile.source.capturedAt ?? "unknown"}\n` +
    `- Viewports: ${profile.source.viewportCount}\n` +
    `- Browser backend: ${profile.source.tooling ?? "unknown"}\n\n` +
    `## Responsive Snapshot\n\n${markdownTable(["Viewport", "Size", "Document height", "Hero type", "Nav height", "Images"], viewportRows)}\n\n` +
    `## Observed Color Signals\n\n${markdownTable(["Value", "Occurrences", "Examples"], colorRows)}\n\n` +
    `## Observed Typography Patterns\n\n${markdownTable(["Family", "Size", "Weight", "Line height", "Tracking", "Occurrences"], typographyRows)}\n\n` +
    `## Primary Composition\n\n${markdownTable(["Order", "Tag", "Heading or text", "Geometry", "Images", "Controls"], sectionRows)}\n\n` +
    `## Image Behavior\n\n${markdownTable(["Viewport", "Asset", "Source mode", "Rendered", "Owner", "Picture sources"], mediaRows)}\n\n` +
    `## Frequent Shape & Spacing Signals\n\n` +
    `- Radii: ${profile.styleSignals.radii.slice(0, 10).map((item) => `${item.value} (${item.count})`).join(", ") || "none"}\n` +
    `- Shadows: ${profile.styleSignals.shadows.slice(0, 6).map((item) => `${item.value} (${item.count})`).join(", ") || "none"}\n` +
    `- Section backgrounds: ${profile.styleSignals.sectionBackgrounds.slice(0, 10).map((item) => `${item.value} (${item.count})`).join(", ") || "none"}\n` +
    `- Source modes: ${profile.imagery.selectedSourceModes.map((item) => `${item.value} (${item.count})`).join(", ") || "none"}\n\n` +
    `## Agent Synthesis Checklist\n\n` +
    `1. Write the style in one sentence without naming page sections.\n` +
    `2. Separate transferable principles from brand-specific assets and trade dress.\n` +
    `3. Turn color frequency into semantic foreground/background/action roles.\n` +
    `4. Turn typography samples into a closed hierarchy with explicit breakpoints.\n` +
    `5. Describe layout rhythm, density, image treatment, shape language, and motion.\n` +
    `6. Write retain/reinterpret/replace rules for a new business context.\n` +
    `7. Record uncertainty wherever evidence is incomplete.\n\n` +
    `## Evidence Gaps\n\n` +
    `${profile.evidenceGaps.length ? profile.evidenceGaps.map((gap) => `- ${gap}`).join("\n") : "- None detected by the deterministic profile."}\n`;
}
