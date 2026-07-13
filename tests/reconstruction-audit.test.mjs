import assert from "node:assert/strict";
import test from "node:test";
import { auditReconstruction } from "../lib/reconstruction-audit.mjs";

function pageFixture(width = 1440, height = 900) {
  return {
    viewport: { width, height },
    documentHeight: 2200,
    headings: [{ text: "Product" }, { text: "Gallery" }],
    structure: {
      counts: {
        mainChildren: 3,
        sections: 2,
        articles: 0,
        pictures: 1,
        images: 1,
        svgs: 2,
        headings: 2,
        links: 3,
        buttons: 1,
        galleryItems: 1,
        footerGroups: 1,
      },
      topLevel: [{ heading: "Product" }, { heading: "Gallery" }],
      footerGroups: [{ heading: "Resources", text: "Resources Documentation" }],
    },
    galleryItems: [{ ariaLabel: "Gallery item one", text: "Gallery item one" }],
    assets: {
      images: [
        {
          src: "https://example.com/large.jpg",
          alt: "Product image",
          complete: true,
          naturalWidth: 1200,
          naturalHeight: 800,
          renderedGeometry: { x: 120, y: 300, width: 1200, height: 800 },
          owner: { geometry: { x: 100, y: 280, width: 1240, height: 840 } },
          pictureSources: [
            { media: "(max-width: 734px)", srcset: "small.jpg" },
            { media: "(max-width: 1068px)", srcset: "medium.jpg" },
          ],
          placeholder: { suspected: false, reasons: [] },
        },
      ],
    },
  };
}

test("complete reconstruction audit passes matching evidence", () => {
  const original = { pages: { desktop: pageFixture() } };
  const replica = structuredClone(original);
  const report = auditReconstruction(original, replica, { mode: "complete" });
  assert.equal(report.passed, true);
  assert.equal(report.summary.failures, 0);
});

test("complete reconstruction audit catches gallery, source, and geometry regressions", () => {
  const original = { pages: { desktop: pageFixture() } };
  const replica = structuredClone(original);
  replica.pages.desktop.structure.counts.galleryItems = 0;
  replica.pages.desktop.galleryItems = [];
  replica.pages.desktop.structure.counts.footerGroups = 0;
  replica.pages.desktop.structure.footerGroups = [];
  replica.pages.desktop.assets.images[0].renderedGeometry.width = 900;
  replica.pages.desktop.assets.images[0].pictureSources.pop();

  const report = auditReconstruction(original, replica, { mode: "complete" });
  const codes = new Set(report.failures.map((issue) => issue.code));
  assert.equal(report.passed, false);
  assert.ok(codes.has("count-mismatch:galleryItems"));
  assert.ok(codes.has("count-mismatch:footerGroups"));
  assert.ok(codes.has("count-mismatch:pictureSources"));
  assert.ok(codes.has("gallery-order-mismatch"));
  assert.ok(codes.has("footer-groups-mismatch"));
  assert.ok(codes.has("responsive-source-mismatch"));
  assert.ok(codes.has("image-geometry-mismatch"));
});

test("representative audit permits a missing viewport but reports it", () => {
  const original = { pages: { desktop: pageFixture(), mobile: pageFixture(390, 844) } };
  const replica = { pages: { desktop: pageFixture() } };
  const report = auditReconstruction(original, replica, { mode: "representative" });
  assert.equal(report.passed, true);
  assert.ok(report.warnings.some((issue) => issue.code === "missing-viewport"));
});
