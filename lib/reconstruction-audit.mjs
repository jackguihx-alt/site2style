function cleanText(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function semanticLabel(value) {
  const text = cleanText(value);
  const words = text.split(" ");
  if (words.length > 1 && words.length % 2 === 0) {
    const midpoint = words.length / 2;
    const first = words.slice(0, midpoint).join(" ");
    const second = words.slice(midpoint).join(" ");
    if (first === second) return first;
  }
  return text;
}

function visibleGeometry(geometry) {
  return geometry && geometry.width > 1 && geometry.height > 1;
}

function imageGeometry(image) {
  return (
    image.renderedGeometry ?? {
      x: image.x ?? null,
      y: image.y ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
    }
  );
}

function ownerGeometry(image) {
  return image.owner?.geometry ?? null;
}

function imageLabel(image, index) {
  const alt = cleanText(image.alt);
  if (alt) return alt;
  try {
    const pathname = new URL(image.src).pathname;
    return pathname.split("/").filter(Boolean).pop() || `image ${index + 1}`;
  } catch {
    return `image ${index + 1}`;
  }
}

function pageMetrics(page) {
  const images = page.assets?.images ?? page.images ?? [];
  const counts = page.structure?.counts ?? {};
  const topLevel = page.structure?.topLevel ?? [];
  const footerGroups = page.structure?.footerGroups ?? [];
  const headings = (page.headings ?? [])
    .map((item) => cleanText(item.text))
    .filter(Boolean);
  const galleryItems = page.galleryItems ?? [];
  const visibleImages = images.filter((image) => visibleGeometry(imageGeometry(image)));
  const brokenImages = visibleImages.filter(
    (image) => image.complete === false || (image.complete === true && (!image.naturalWidth || !image.naturalHeight))
  );
  const placeholderImages = visibleImages.filter((image) => image.placeholder?.suspected);

  return {
    viewport: page.viewport ?? null,
    documentHeight: page.documentHeight ?? page.root?.height ?? null,
    counts: {
      mainChildren: counts.mainChildren ?? topLevel.length,
      sections: counts.sections ?? null,
      articles: counts.articles ?? null,
      pictures: counts.pictures ?? null,
      images: counts.images ?? images.length,
      svgs: counts.svgs ?? null,
      visibleSvgs: counts.visibleSvgs ?? null,
      headings: counts.headings ?? headings.length,
      links: counts.links ?? null,
      buttons: counts.buttons ?? null,
      iconControls: counts.iconControls ?? null,
      galleryItems: counts.galleryItems ?? galleryItems.length,
      footerGroups: counts.footerGroups ?? footerGroups.length,
      pictureSources: images.reduce((sum, image) => sum + (image.pictureSources?.length ?? 0), 0),
      responsiveImages: images.filter((image) => (image.pictureSources?.length ?? 0) > 0).length,
    },
    headings,
    topLevelHeadings: topLevel.map((item) => cleanText(item.heading)).filter(Boolean),
    gallerySignatures: galleryItems.map((item) => cleanText(item.ariaLabel || item.text)).filter(Boolean),
    footerSignatures: footerGroups.map((item) => semanticLabel(item.heading || item.text)).filter(Boolean),
    images,
    brokenImageCount: brokenImages.length,
    placeholderImageCount: placeholderImages.length,
    brokenImages: brokenImages.map(imageLabel),
    placeholderImages: placeholderImages.map(imageLabel),
  };
}

function normalizedPageMap(evidence) {
  if (!evidence || typeof evidence !== "object") return {};
  return evidence.pages && typeof evidence.pages === "object" ? evidence.pages : evidence;
}

function numberMismatch(expected, actual, ratioTolerance, absoluteTolerance) {
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
  return Math.abs(expected - actual) > Math.max(absoluteTolerance, Math.abs(expected) * ratioTolerance);
}

function compareGeometry(original, replica, ratioTolerance) {
  const fields = ["x", "y", "width", "height"];
  return fields
    .filter((field) =>
      numberMismatch(original?.[field], replica?.[field], ratioTolerance, field === "x" || field === "y" ? 8 : 4)
    )
    .map((field) => ({ field, expected: original[field], actual: replica[field] }));
}

function findReplicaImage(originalImage, originalIndex, replicaImages, usedIndexes) {
  const alt = cleanText(originalImage.alt).toLowerCase();
  if (alt) {
    const matchingIndex = replicaImages.findIndex(
      (image, index) => !usedIndexes.has(index) && cleanText(image.alt).toLowerCase() === alt
    );
    if (matchingIndex >= 0) return matchingIndex;
  }
  return usedIndexes.has(originalIndex) ? -1 : originalIndex;
}

function compareImages(originalImages, replicaImages, mode) {
  const geometryMismatches = [];
  const sourceMappingMismatches = [];
  const usedIndexes = new Set();
  const tolerance = mode === "complete" ? 0.035 : 0.12;

  for (const [originalIndex, originalImage] of originalImages.entries()) {
    const replicaIndex = findReplicaImage(originalImage, originalIndex, replicaImages, usedIndexes);
    const replicaImage = replicaImages[replicaIndex];
    if (!replicaImage) continue;
    usedIndexes.add(replicaIndex);

    const rendered = compareGeometry(imageGeometry(originalImage), imageGeometry(replicaImage), tolerance);
    const owner = compareGeometry(ownerGeometry(originalImage), ownerGeometry(replicaImage), tolerance)
      .filter((item) => item.field === "width" || item.field === "height");
    if (rendered.length || owner.length) {
      geometryMismatches.push({
        originalIndex,
        replicaIndex,
        image: imageLabel(originalImage, originalIndex),
        rendered,
        owner,
      });
    }

    const originalMedia = (originalImage.pictureSources ?? []).map((source) => cleanText(source.media));
    const replicaMedia = (replicaImage.pictureSources ?? []).map((source) => cleanText(source.media));
    if (JSON.stringify(originalMedia) !== JSON.stringify(replicaMedia)) {
      sourceMappingMismatches.push({
        originalIndex,
        replicaIndex,
        image: imageLabel(originalImage, originalIndex),
        expectedMedia: originalMedia,
        actualMedia: replicaMedia,
      });
    }
  }

  return { geometryMismatches, sourceMappingMismatches };
}

function publicMetrics(metrics) {
  return {
    viewport: metrics.viewport,
    documentHeight: metrics.documentHeight,
    counts: metrics.counts,
    headings: metrics.headings,
    topLevelHeadings: metrics.topLevelHeadings,
    gallerySignatures: metrics.gallerySignatures,
    footerSignatures: metrics.footerSignatures,
    brokenImageCount: metrics.brokenImageCount,
    placeholderImageCount: metrics.placeholderImageCount,
  };
}

export function auditReconstruction(originalEvidence, replicaEvidence, options = {}) {
  const mode = options.mode === "representative" ? "representative" : "complete";
  const originalPages = normalizedPageMap(originalEvidence);
  const replicaPages = normalizedPageMap(replicaEvidence);
  const originalNames = Object.keys(originalPages);
  const replicaNames = Object.keys(replicaPages);
  const failures = [];
  const warnings = [];
  const pageReports = {};
  const addIssue = (severity, code, viewport, message, details) => {
    const issue = { code, viewport, message };
    if (details !== undefined) issue.details = details;
    (severity === "failure" ? failures : warnings).push(issue);
  };

  for (const viewportName of originalNames) {
    const originalPage = originalPages[viewportName];
    const replicaPage = replicaPages[viewportName];
    if (!replicaPage) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "missing-viewport",
        viewportName,
        `Replica evidence does not contain the ${viewportName} viewport.`
      );
      continue;
    }

    const original = pageMetrics(originalPage);
    const replica = pageMetrics(replicaPage);
    const imageComparison = compareImages(original.images, replica.images, mode);
    const report = {
      original: publicMetrics(original),
      replica: publicMetrics(replica),
      geometryMismatches: imageComparison.geometryMismatches.slice(0, 40),
      sourceMappingMismatches: imageComparison.sourceMappingMismatches.slice(0, 40),
    };
    pageReports[viewportName] = report;

    if (
      original.viewport?.width !== replica.viewport?.width ||
      original.viewport?.height !== replica.viewport?.height ||
      (original.viewport?.devicePixelRatio != null &&
        replica.viewport?.devicePixelRatio != null &&
        original.viewport.devicePixelRatio !== replica.viewport.devicePixelRatio) ||
      (original.viewport?.colorScheme &&
        replica.viewport?.colorScheme &&
        original.viewport.colorScheme !== replica.viewport.colorScheme)
    ) {
      addIssue("failure", "viewport-mismatch", viewportName, "Viewport dimensions differ.", {
        expected: original.viewport,
        actual: replica.viewport,
      });
    }

    const heightTolerance = mode === "complete" ? 0.03 : 0.15;
    if (numberMismatch(original.documentHeight, replica.documentHeight, heightTolerance, 24)) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "document-height-mismatch",
        viewportName,
        "Document height is outside the allowed tolerance.",
        { expected: original.documentHeight, actual: replica.documentHeight, tolerance: heightTolerance }
      );
    }

    const criticalCounts = ["images", "pictures", "galleryItems", "footerGroups", "links", "buttons", "iconControls", "pictureSources", "responsiveImages"];
    for (const key of criticalCounts) {
      const expected = original.counts[key];
      const actual = replica.counts[key];
      if (Number.isFinite(expected) && Number.isFinite(actual) && expected !== actual) {
        addIssue(
          mode === "complete" ? "failure" : "warning",
          `count-mismatch:${key}`,
          viewportName,
          `${key} count differs: expected ${expected}, found ${actual}.`
        );
      }
    }

    for (const key of ["mainChildren", "sections", "articles", "svgs", "visibleSvgs", "headings"]) {
      const expected = original.counts[key];
      const actual = replica.counts[key];
      if (Number.isFinite(expected) && Number.isFinite(actual) && expected !== actual) {
        addIssue("warning", `structural-count:${key}`, viewportName, `${key} count differs: expected ${expected}, found ${actual}.`);
      }
    }

    const replicaHeadingSet = new Set(replica.headings.map((heading) => heading.toLowerCase()));
    const missingHeadings = original.headings.filter((heading) => !replicaHeadingSet.has(heading.toLowerCase()));
    if (missingHeadings.length) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "missing-headings",
        viewportName,
        `${missingHeadings.length} visible heading(s) are missing or changed.`,
        missingHeadings
      );
    }

    if (original.gallerySignatures.length && JSON.stringify(original.gallerySignatures) !== JSON.stringify(replica.gallerySignatures)) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "gallery-order-mismatch",
        viewportName,
        "Gallery item order or labels differ.",
        { expected: original.gallerySignatures, actual: replica.gallerySignatures }
      );
    }
    if (original.footerSignatures.length && JSON.stringify(original.footerSignatures) !== JSON.stringify(replica.footerSignatures)) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "footer-groups-mismatch",
        viewportName,
        "Footer group order or labels differ.",
        { expected: original.footerSignatures, actual: replica.footerSignatures }
      );
    }

    if (original.brokenImageCount || original.placeholderImageCount) {
      addIssue("failure", "incomplete-original-evidence", viewportName, "Original evidence contains visible broken or placeholder images.", {
        broken: original.brokenImages,
        placeholders: original.placeholderImages,
      });
    }
    if (replica.brokenImageCount || replica.placeholderImageCount) {
      addIssue("failure", "invalid-replica-images", viewportName, "Replica contains visible broken or placeholder images.", {
        broken: replica.brokenImages,
        placeholders: replica.placeholderImages,
      });
    }

    if (imageComparison.sourceMappingMismatches.length) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "responsive-source-mismatch",
        viewportName,
        `${imageComparison.sourceMappingMismatches.length} image(s) use different picture media mappings.`
      );
    }
    if (imageComparison.geometryMismatches.length) {
      addIssue(
        mode === "complete" ? "failure" : "warning",
        "image-geometry-mismatch",
        viewportName,
        `${imageComparison.geometryMismatches.length} image(s) differ in rendered or owner geometry.`
      );
    }
  }

  const extraViewports = replicaNames.filter((name) => !originalNames.includes(name));
  if (extraViewports.length) {
    addIssue("warning", "extra-viewports", null, "Replica evidence contains additional viewport captures.", extraViewports);
  }
  if (!originalNames.some((name) => replicaNames.includes(name))) {
    addIssue("failure", "no-common-viewports", null, "The evidence files have no viewport names in common.");
  }

  return {
    mode,
    passed: failures.length === 0,
    summary: {
      expectedViewports: originalNames.length,
      comparedViewports: Object.keys(pageReports).length,
      failures: failures.length,
      warnings: warnings.length,
    },
    failures,
    warnings,
    pages: pageReports,
  };
}
