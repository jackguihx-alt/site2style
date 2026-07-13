# High-Fidelity Reconstruction Rules

Read this reference when the user asks to replicate a page, improve fidelity, or deliver a complete website rather than only a design-system document.

For the concrete failure analysis behind these rules, read `apple-homepage-case-study.md`.

## 1. Decide What “Complete” Means

- **Design-system validation**: one representative page or section may be enough.
- **Page replication**: reproduce the complete visible page, including every section, repeated item, footer group, responsive source, and meaningful interaction.
- Never label a representative sample as a complete replica.
- Record personalized, region-specific, authenticated, randomized, or time-varying content that cannot be made deterministic.

## 2. Keep Four Geometries Separate

For every important image or component, record these independently:

1. Viewport width and height.
2. Outer component/container rectangle.
3. Rendered image rectangle.
4. Intrinsic asset dimensions.

Do not use intrinsic image size as the card size. A square cover can be centered inside the same landscape card used by every gallery item.

## 3. Capture Responsive Images Completely

- Save `currentSrc`, `src`, `srcset`, `sizes`, every sibling `<source>`, and each source's `media` and `type`.
- Test width and height conditions. Some sites select `large`, `largetall`, `medium`, `mediumtall`, and `small` independently.
- Record which source actually wins at every captured viewport.
- Capture responsive logos separately from their background artwork.
- Deduplicate identical `<source>` entries produced by lazy-loading or fallback markup.

## 4. Treat Dynamic Galleries as Data

For each gallery, carousel, tab list, or horizontally scrolling collection, record:

- Semantic item count and order.
- Item ID, role, accessible label, CTA, descriptive text, and destination.
- Outer item rectangle and image rectangle.
- Current and alternative responsive assets.
- Selected, hidden, cloned, or placeholder state.

Do not mistake a small logo asset for a full-card background because the IDs are similar. Match assets by item semantics and container ownership.

## 5. Handle Lazy Loading

- Scroll enough to trigger lazy assets, then wait for image completion.
- Ignore transparent GIF/data-URI placeholders when a real `src`, `data-src`, `srcset`, or `<noscript>` source exists.
- A loaded URL alone is not proof of visibility. Check `complete`, `naturalWidth`, rendered rectangle, and owning item.
- Preserve real inaccessible assets as evidence gaps; do not silently substitute unrelated images.

## 6. Preserve Structural Completeness

Before implementation, create an inventory of:

- Top-level sections in order.
- Headings in order.
- Repeated item counts per section.
- Footer groups and links.
- Dialogs, menus, tabs, disclosures, and controls.

For a complete replica, original and reconstruction counts must agree unless a documented dynamic exception applies.

## 7. Scope CSS Selectors by Ownership

- Use direct-child or explicit role classes for full-bleed media: `.promo > .promo-picture`, not `.promo picture`.
- Adding a nested `<picture>` for a logo must not make it inherit background-image positioning rules.
- Test every new wrapper against existing descendant selectors.
- Keep fixed dimensions and responsive constraints on cards, boards, controls, and media frames so content cannot resize the layout.

## 8. Validate Assets Before Visual Review

- Check every `src`, `srcset`, poster, background, and font URL.
- Treat HTTP failures, zero-width images, placeholder data URIs, and wrong media-source selection as blocking fidelity defects.
- Do not rely on a single successful desktop URL when mobile uses a different asset.
- Do not commit third-party copyrighted assets into an open-source Skill repository; keep extraction outputs separate and document ownership.

## 9. Visual Validation Discipline

- Capture original and reconstruction at identical width, height, DPR, color scheme, and scroll position.
- Reset scroll to the top after lazy-load and hover probes.
- Validate the first viewport, each major section, and the full document height.
- Compare source-selection suffixes as well as pixels.
- Fix the largest structural and image errors before typography micro-adjustments.
- Verify semantic foreground/background pairs in the generated design-system HTML; extracted colors are not interchangeable merely because they belong to the same site.

## 10. Runtime Hygiene

- Close browser contexts, browsers, MCP transports, and child processes in `finally` blocks.
- After tests, verify no extraction or MCP process remains.
- Remove temporary browser profiles and artifacts unless the user requested them.

## Release Gate

A complete replica is ready only when:

- Section and repeated-item counts match.
- Responsive source selection is verified at every target condition.
- Container and image geometry are not conflated.
- Asset URL validation passes.
- No visible placeholder, overlap, blank card, or unexplained size change remains.
- `DESIGN.md`, visual presentation, evidence, and reconstruction describe the same responsive system.
