import assert from "node:assert/strict";
import test from "node:test";
import { buildStyleProfile, styleProfileToMarkdown } from "../lib/style-profile.mjs";

function styleNode(overrides = {}) {
  return {
    text: "Sample",
    fontFamily: "system-ui",
    fontSize: "17px",
    fontWeight: "400",
    lineHeight: "25px",
    letterSpacing: "0px",
    color: "rgb(29, 29, 31)",
    backgroundColor: "rgb(255, 255, 255)",
    borderColor: "rgb(210, 210, 215)",
    borderRadius: "0px",
    boxShadow: "none",
    padding: "0px",
    margin: "0px",
    gap: "normal",
    width: 100,
    height: 25,
    ...overrides,
  };
}

function page(width, height, sourceMode, heroSize) {
  return {
    viewport: { width, height, devicePixelRatio: 1, colorScheme: "light" },
    documentHeight: 2200,
    root: styleNode({ width, height: 2200 }),
    body: styleNode({ width, height: 2200 }),
    nav: styleNode({ text: "Navigation", height: 48, backgroundColor: "rgba(255, 255, 255, 0.8)" }),
    heroHeading: styleNode({ text: "Product", fontSize: heroSize, fontWeight: "600", lineHeight: heroSize }),
    headings: [styleNode({ text: "Section", fontSize: "40px", fontWeight: "600", lineHeight: "44px" })],
    buttons: [styleNode({ text: "Learn more", color: "rgb(0, 113, 227)", borderRadius: "22px" })],
    sections: [{ text: "Hero", backgroundColor: "rgb(245, 245, 247)", paddingTop: "64px", paddingBottom: "64px" }],
    structure: {
      counts: { mainChildren: 2, sections: 2, images: 1, links: 4, buttons: 1 },
      topLevel: [{ tag: "section", heading: "Product", text: "Product hero", geometry: { width, height: 650 }, imageCount: 1, interactiveCount: 2 }],
    },
    assets: {
      images: [{
        src: `https://cdn.example.com/product_${sourceMode}.jpg`,
        alt: "Product image",
        sourceMode,
        renderedGeometry: { x: 0, y: 48, width, height: 650 },
        owner: { geometry: { x: 0, y: 48, width, height: 650 } },
        intrinsicGeometry: { width: width * 2, height: 1300 },
        pictureSources: [{ media: "(max-width: 734px)", srcset: "small.jpg" }],
      }],
    },
    interactiveCandidates: [{ label: "Learn more", selector: "a.cta", color: "rgb(0, 113, 227)", borderRadius: "22px" }],
  };
}

test("style profile aggregates measured visual and responsive signals", () => {
  const evidence = {
    url: "https://example.com",
    extractedAt: "2026-07-11T00:00:00.000Z",
    tooling: { selectedBackend: "playwright" },
    pages: {
      desktop: page(1440, 900, "largetall", "56px"),
      mobile: page(390, 844, "small", "40px"),
    },
    interactions: { desktop: { hover: [] } },
  };

  const profile = buildStyleProfile(evidence);
  assert.equal(profile.source.viewportCount, 2);
  assert.equal(profile.viewports.desktop.displayHeading.fontSize, "56px");
  assert.equal(profile.viewports.mobile.displayHeading.fontSize, "40px");
  assert.ok(profile.styleSignals.colors.some((item) => item.value === "rgb(29, 29, 31)"));
  assert.ok(profile.styleSignals.radii.some((item) => item.value === "22px"));
  assert.deepEqual(profile.imagery.selectedSourceModes.map((item) => item.value).sort(), ["largetall", "small"]);
  assert.equal(profile.imagery.assetHosts[0].value, "cdn.example.com");
  assert.match(styleProfileToMarkdown(profile), /Agent Synthesis Checklist/);
});
