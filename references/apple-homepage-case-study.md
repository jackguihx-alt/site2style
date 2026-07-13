# Apple Homepage Reconstruction Case Study

This case study records concrete failure modes observed while using the Skill on the Apple homepage. It is historical evidence for the general rules in `high-fidelity-reconstruction.md`; it is not an Apple-specific implementation guide.

Capture date: 2026-07-10. The live page can change, so counts below describe that capture only.

## What Looked Acceptable but Was Not Complete

The reconstruction had the main heroes, promotion grid, entertainment rail, service rail, and footer. At a glance it resembled the source. A structured complete-mode audit still found:

- Original evidence: 49 images, 49 pictures, 18 semantic gallery items, and 336 links.
- Reconstruction evidence: 31 images, 31 pictures, no semantic gallery items, and 46 links.
- The reconstruction referenced 149 unique external assets and all 149 URLs were reachable, proving that valid assets alone do not prove page completeness.

Lesson: visual resemblance, valid URLs, and complete scope are separate gates.

## Failure to Rule Mapping

### Missing icons

**Observed:** text and major imagery were captured before the site's SVG/icon system, so navigation and controls felt generic.

**Rule:** inventory inline SVG, sprites, remote SVG, icon fonts, defs, and hover variants as a separate extraction pass. Export a searchable icon library instead of redrawing familiar symbols.

**Guard:** `extract_icon_library` and the icon-library requirements in `SKILL.md`.

### Incomplete page presented as a replica

**Observed:** representative heroes and promos were mistaken for a full homepage result.

**Rule:** decide `representative` versus `complete` before implementation. In complete mode, preserve every visible section, repeated item, footer group, and meaningful control.

**Guard:** `audit_reconstruction` compares viewport coverage, repeated counts, headings, gallery order, footer groups, links, and controls.

### Wrong responsive image

**Observed:** using only desktop/mobile sources missed height-controlled variants such as `largetall` and `mediumtall`. One entertainment card also used a similarly named logo asset as its background.

**Rule:** collect every `<source>` with `media`, `srcset`, `sizes`, and `type`, plus `currentSrc` at desktop tall/short, tablet tall/short, and mobile. Match an asset to the semantic item and owning container, not only a filename fragment.

**Guard:** the `full` five-viewport profile, source-mode evidence, deduplicated picture mappings, and responsive-source audit.

### Card and image size conflated

**Observed:** square service artwork was enlarged as though its intrinsic dimensions defined the outer landscape card. Cards then appeared to have inconsistent sizes.

**Rule:** store viewport, outer card, rendered image, and intrinsic image dimensions independently. Keep repeated outer frames equal and center or crop artwork according to the source.

**Guard:** evidence now records `owner`, `picture`, `renderedGeometry`, and `intrinsicGeometry`; the audit compares rendered and owner geometry separately.

### Nested logo inherited background positioning

**Observed:** a broad `.promo picture` rule also selected a nested Trade In logo picture, stretching and overlapping it with the CTA.

**Rule:** full-bleed media selectors must express ownership, such as `.promo > .promo-picture`. Test a new wrapper against existing descendant selectors.

**Guard:** the CSS ownership rule and final selector-scope check in `SKILL.md`.

### Readability drift in the design-system HTML

**Observed:** extracted dark backgrounds and foreground tokens were combined without preserving their roles, producing low-contrast text.

**Rule:** document colors as semantic foreground/background pairs and inspect the rendered HTML presentation. A token value is not reusable without its role and state.

**Guard:** HTML presentation review remains a required visual check; contrast defects block completion.

### Browser capability tied to one Agent

**Observed:** an in-app browser helped during development, but GitHub users may run Claude, Cursor, Copilot, another MCP client, or a plain shell.

**Rule:** the workflow must have an Agent-neutral runtime contract.

**Guard:** CLI plus stdio MCP, with Playwright first and installed Chromium browsers as fallback. Vendor browser tools are optional supplements.

### Test process remained alive

**Observed:** closing an MCP client without closing its transport could leave the server process running.

**Rule:** close browser contexts, browser processes, MCP clients, transports, and child processes in `finally` blocks.

**Guard:** MCP tests close both client and transport, and release verification checks for lingering processes.

### Audit selectors produced false completeness counts

**Observed:** substring selectors initially counted `media-gallery-item-container` as a gallery item and every `...column-section-link` as a footer group. That changed the real 18 gallery items into 20 and the real 11 footer groups into 76.

**Rule:** audit evidence needs the same rigor as page code. Prefer roles and data attributes, then match complete semantic class tokens; distinguish an item from its container and a group from its descendants.

**Guard:** browser extraction tests now include deliberately misleading container and link class names, and assert that only the semantic item/group is counted.

## Resulting Release Gate

The Skill now separates four questions:

1. **Evidence:** Did extraction observe every relevant responsive condition and dynamic item?
2. **Assets:** Do all referenced resources resolve, and are they attached to the correct semantic item?
3. **Completeness:** Does the reconstruction preserve the promised sections, repeated items, footer groups, content, and controls?
4. **Visual fidelity:** At identical viewport state, do container geometry, image geometry, typography, color, and interaction states match closely?

A complete replica is not ready when only one or two of these gates pass.

## Known Limits

- The evidence audit is deterministic but does not replace screenshot inspection or pixel-difference tooling.
- Personalized, regional, randomized, authenticated, and time-varying content needs documented exceptions.
- Semantic counts can expose missing content but cannot prove that every interaction behaves identically.
- Source assets remain owned by their original rights holders and should not be bundled into this open-source Skill.
