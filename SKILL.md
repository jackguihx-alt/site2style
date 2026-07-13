---
name: html2style
description: Capture one or more live websites as an evidence-backed, transferable design-language package with an Agent-neutral CLI or MCP interface. Deliver responsive browser evidence, style-profile.json, STYLE.md, a visual HTML style board, and optionally DESIGN.md, assets, icons, a complete reconstruction, or an original site using the measured design logic. Use when the user asks to extract or learn a website's style, reverse-engineer a design system, create a site inspired by a reference without copying its brand, improve DESIGN.md, collect tokens/assets/components/icons, replicate a permitted website, or audit visual fidelity.
---

# HTML2Style

Turn a real website into portable design evidence and reusable visual rules that another Agent can apply without depending on the original page or a vendor-specific browser.

Default deliverables:

- `design-package/`: the default final delivery folder. It contains one human entry point, one cross-session Agent handoff, the core style files, a manifest, and optional advanced/evidence subfolders.
- `START-HERE.md`: tells a human which single file to open for their role.
- `START-HERE.html`: double-click entry point with the visual board link and a copyable cross-session prompt.
- `AGENT-HANDOFF.md`: self-contained instructions that let a new Agent session reuse the package without the original conversation.
- `manifest.json`: stable machine-readable package identity, entry points, source metadata, file roles, and evidence gaps.
- `STYLE.md`: compact transferable design language for reuse in a different product or business context.
- `style-profile.json`: deterministic measurements behind `STYLE.md`, generated from browser evidence.
- `style-board.html`: human-readable presentation of the design DNA when style extraction is the requested scope.
- `DESIGN.md`: structured source of truth for agents.
- `design-system.html`: visual HTML presentation of the system for humans, rendered with the extracted tokens and components.
- Icon library: searchable HTML page, `icons-data.json`, and standalone SVG files when icons are available.
- Asset manifest: image, background, font, SVG, and resource URLs with responsive reference screenshots.
- Fidelity comparison: a representative sample for design-system validation, or the complete visible page when the user asks for a full replica.
- Design-language transfer: an original website for a new person, product, or business that reuses measured visual principles without copying source branding, content, or proprietary assets.

Use evidence from the live page first: DOM, computed styles, CSS variables, network resources, screenshots for verification, and visible interactions. Do not infer precise token values from memory or screenshots alone. Do not replace original images, logos, or icons with approximations when extractable source assets exist.

## Start

1. Determine the mode:
   - Style extraction: user wants to understand or reuse the visual language. Deliver the style package without building a replica or new website unless requested.
   - New extraction: user gives URL(s), create the full deliverable set.
   - Supplement existing work: user gives `DESIGN.md` and URL(s), read the existing file first, list gaps, then collect only the missing evidence.
   - Complete replication: inventory and reproduce every visible section and repeated item. Do not silently downgrade this to a representative sample.
   - Design-language transfer: user gives a reference site or `DESIGN.md` plus a new purpose, create an original information architecture and content system using the transferable design principles.
2. Check tool fit:
   - Run `html2style doctor` or the MCP `browser_doctor` tool first.
   - Use the bundled Agent-neutral browser pipeline when the page needs JavaScript rendering, login, computed styles, CSS variables, SVG sprites, screenshots, or interaction states.
   - A host Agent's own browser tool may supplement inspection, but it must not be a requirement for the workflow.
   - Use static fetch only when the public HTML already contains the target content and precise computed styles are not required.
   - If browser tooling is unavailable, read `references/browser-tooling-bootstrap.md` and guide setup instead of silently downgrading for dynamic pages.
3. Scope pages and viewports:
   - If the site clearly has distinct page types and only one URL was provided, ask for 2-5 representative URLs when that would materially improve page-pattern coverage.
   - For simple one-page sites, proceed with the single URL.
   - Use the `full` profile by default: desktop tall/short, tablet tall/short, and mobile. This covers responsive image sources controlled by both width and height.
   - Use `standard` or `minimal` only when speed materially matters, and record the skipped responsive conditions.
   - Keep viewport dimensions identical when comparing the original and reconstruction.
4. Handle login safely:
   - Use `--headed --login-wait <seconds>` to open a visible temporary browser and let the user sign in manually.
   - Do not ask for credentials, automate MFA bypass, or choose accounts for the user.

## Portability Contract

- Any Agent with shell access can use the `html2style` CLI.
- Any MCP-compatible Agent can use the bundled stdio server in `mcp/server.mjs`.
- `SKILL.md`, `AGENTS.md`, and vendor adapter files are discovery aids, not runtime dependencies.
- Do not require Codex In-app Browser, Claude browser tools, Cursor browser tools, or another vendor-specific integration.
- Do not bundle a browser executable. Detect Playwright or a local Chrome/Chromium/Edge installation and provide setup guidance when neither exists.

## Extraction Passes

Run these passes for new extractions. For supplement mode, run only the relevant passes and merge without overwriting correct existing content.

1. Scope: page purpose, visible sections, unreachable/login-gated areas.
2. Baseline evidence: root CSS variables, representative `outerHTML`, computed styles, text snippets, complete image/background/font/SVG/resource manifests, full `<picture>` source mappings, container/image/intrinsic geometry, structural counts, and responsive reference screenshots.
3. Tokens: color roles, typography, spacing, radii by component, borders, shadows, focus rings, motion values, z-index.
4. Components: navigation, buttons, links, cards, forms, selects, tabs, tables, badges, dialogs, drawers, empty states, and distinctive business components. Capture default, hover, focus, disabled, selected, expanded, and sticky states where observable.
5. Icons: determine whether icons are inline SVG, sprite symbols, remote SVGs, icon fonts, or mixed. Extract symbols in bulk, preserve semantic hard-coded colors, include required gradient defs, pair normal/hover variants, and export a searchable library when possible.
6. Page patterns: summarize layout archetypes and preserve top-level section order, repeated-item counts, gallery semantics, footer groups, dimensions, and selection guidance.
7. Content voice: heading style, CTA wording, density, trust signals, naming patterns, and brand tone.
8. Validation: build the scope promised to the user, compare it at every captured viewport, audit structural and asset parity, list the largest mismatches, and revise until no major structural, asset, typography, color, or responsive mismatch remains.

Use `references/website-reading-checklist.md` for extraction passes. Read `references/high-fidelity-reconstruction.md` whenever replication or fidelity improvement is requested. Read `references/design-language-transfer.md` when the user wants a new website based on a reference style. `references/apple-homepage-case-study.md` explains the real failure modes behind these rules.

## Style Extraction Mode

Use this as the default when the user says "extract the style", "learn this visual language", "make a style package", or wants to tell a design-transfer story.

1. Capture browser evidence at the full responsive profile.
2. Run `html2style profile evidence.json style-profile.json --markdown STYLE-measurements.md`.
3. Read `assets/STYLE.template.md` and synthesize `STYLE.md` from measured evidence.
4. For each design-DNA claim, separate observation, measurement, transferable rule, and confidence.
5. Split source material into `retain`, `reinterpret`, and `replace`. Brand marks, source copy, proprietary imagery, and distinctive campaign concepts belong in `replace` by default.
6. Render `STYLE.md` to `style-board.html` for human review.
7. Run `html2style bundle design-package --style STYLE.md --profile style-profile.json --board style-board.html`, including measurements/evidence as optional inputs.
8. Deliver `design-package/` as the primary result. Stop there unless the user explicitly asks for a replica or transfer implementation.

Do not treat a color list or component inventory as a style. A useful style package must explain hierarchy, rhythm, density, contrast, shape, imagery, motion, and responsive transformation.

## Cross-Session Reuse

Generated files are not a usable product until they are bundled. Always prefer a portable `design-package/` over a flat folder of unrelated outputs.

- A human starts at `START-HERE.md` or `style-board.html`.
- A new Agent session starts only at `AGENT-HANDOFF.md`; it then reads `STYLE.md` and measured data as directed.
- Automated tools start at `manifest.json` and must use relative entry-point paths.
- Keep `STYLE.md`, `style-profile.json`, and `style-board.html` at package root because they are the reusable core.
- Put `DESIGN.md`, design-system HTML, and icons in `advanced/`.
- Put raw evidence, screenshots, and measured summaries in `evidence/`.
- Include a content-derived package ID so the Agent can state exactly which design language it used.
- Do not require the original chat transcript. Re-extract only when the reference changed or an evidence gap blocks the new task.

## Design-Language Transfer

When the user wants a new site inspired by a reference, do not reproduce the reference page structure by default.

1. Extract transferable principles: typography hierarchy, spacing rhythm, layout density, foreground/background relationships, navigation behavior, image treatment, responsive transitions, motion, and component proportions.
2. Separate non-transferable material: brand marks, company/product names, source copy, campaign concepts, proprietary icons, product photography, and other distinctive source assets.
3. Define the new site's audience, task, content hierarchy, and conversion goal. Use these to choose sections and interactions.
4. Create original imagery or use assets owned by the new site. Do not reuse source assets merely to make the result feel closer.
5. Keep the reference's design logic, not its literal page: for example, preserve quiet navigation, product-led storytelling, sparse copy, full-width bands, and measured responsive behavior while changing content architecture completely.
6. Validate the new site for internal consistency, responsive behavior, accessibility, asset health, and adherence to the extracted design principles. Do not fail it because section or item counts differ from the reference.

For this mode, deliver a short transfer brief that records what was retained, what was deliberately changed, and which assets are original.

## Evidence Scripts

Prefer the portable CLI or bundled MCP tools. Direct scripts remain available for automation and debugging:

- `html2style doctor` / MCP `browser_doctor`: detects Playwright and local Chromium browsers without assuming an Agent platform.
- `html2style extract <url> [outPath] [--profile full] [--headed] [--login-wait 60]`: collects responsive DOM, computed styles, assets, SVG data, and reference screenshots with automatic backend fallback.
- `html2style profile <evidence> [style-profile.json] [--markdown STYLE-measurements.md]`: converts evidence into deterministic style signals for Agent synthesis.
- `html2style bundle <output-dir> --style STYLE.md --profile style-profile.json --board style-board.html [--evidence evidence.json]`: creates the portable, cross-session final delivery.
- `html2style assets <html-or-evidence> [--base-url <url>]`: validates every image/source/background URL before visual review.
- `html2style audit <original-evidence> <replica-evidence> [--mode complete]`: audits viewport, structure, item counts, document height, placeholders, and broken assets.
- `scripts/extract-icons.mjs --from-evidence evidence.json --out ./icons --prefix=<prefix>`: exports sprite and inline SVG icons and builds the searchable icon HTML.
- `scripts/render-design-preview.mjs DESIGN.md design-system.html`: renders the visual HTML presentation from the design document.
- `scripts/render-visual-comparison.mjs original.png replica.png comparison.html`: generates a self-contained side-by-side and overlay comparison page.

Keep intermediate evidence outside the final delivery folder unless the user asks for raw evidence.

## DESIGN.md Requirements

Use `assets/DESIGN.template.md` as the section structure. Fill values with site-specific evidence, not template defaults.

Must include:

- Source URL(s), date, tooling used, and evidence limitations.
- Visual theme and key design characteristics.
- Color roles with exact values and usage.
- Typography hierarchy with font family, size, weight, line height, and tracking.
- Component descriptions with measured dimensions, states, radii, borders, shadows, and snippets where useful.
- Icon-system notes and asset references.
- Asset manifest references, including which images, fonts, logos, and icons must be reused for accurate reconstruction.
- Page-pattern library and responsive behavior.
- Fidelity anchors: exact viewport, major section geometry, content order, asset mapping, and observed responsive changes for the representative reconstruction.
- Agent Prompt Guide containing a closed `:root` CSS variable block and reusable component snippets.

Before finalizing, verify every `var(--token)` used in snippets is defined in the CSS variable block.

## STYLE.md Requirements

Use `assets/STYLE.template.md` when the requested output is a transferable style rather than a replica specification.

`STYLE.md` must include:

- A one-sentence style signature.
- Design DNA across hierarchy, rhythm, density, contrast, shape, imagery, and motion.
- Measured evidence and confidence for every major rule.
- Semantic foreground/background/action color relationships.
- A closed typography grammar with explicit responsive sizes.
- Composition and image-direction rules.
- `retain`, `reinterpret`, and `replace` boundaries.
- Responsive transformations, do/don't guidance, and a reusable transfer prompt.

Keep brand-specific page inventory in `DESIGN.md`; keep transferable design logic in `STYLE.md`.

## HTML Presentation Requirements

The HTML presentation is a core deliverable, not an optional export. It should help a human scan, compare, and reuse the design system.

Build `design-system.html` as a self-contained visual board where practical:

- Sticky table of contents or section navigation.
- Color swatches, typography samples, spacing/radius examples, component demos, icon grid, page-pattern mini layouts, and source/evidence notes.
- Interactive demos for controls when relevant: toggles, selects, tabs, table row selection, expandable panels.
- Styling should use the extracted tokens so the HTML page itself demonstrates the system.
- When `DESIGN.md` changes, regenerate or update the HTML so the document and presentation do not drift.

Use `scripts/render-design-preview.mjs` for a fast first pass, then manually improve the HTML when the site needs richer component or icon presentation.

## Icon Library Requirements

When icons are present, generate an icon library alongside the HTML presentation:

- `icons-data.json` with symbol metadata, defs, and normal/hover pairs.
- `svg/` with standalone SVG files.
- A searchable `图标库.html` or `icons.html` page.

Only convert unfilled single-color shapes to `currentColor`. Preserve hard-coded status colors, brand colors, and gradients.

## Fidelity Gate

When the user wants the site replicated, generating `DESIGN.md` is not completion. Build and verify the exact scope promised: representative for design-system validation, complete for a full-page request. For design-language transfer, validate the new site's own content and responsive system rather than demanding source-page structural parity.

1. Capture original reference screenshots before implementation at every viewport in the selected profile.
2. Reuse original images, logos, fonts, and icons where legally and technically available. Record missing or blocked assets instead of silently substituting them.
3. Keep viewport, outer container, rendered image, and intrinsic asset dimensions separate.
4. For complete mode, match section order and repeated-item counts before styling.
5. Validate all asset URLs and audit evidence parity before visual comparison.
6. Match in this order: content and section order; layout geometry; real assets and icons; typography; colors/borders/shadows; responsive behavior; interaction states and motion.
7. Capture the reconstruction at identical viewport dimensions and reset scroll to the top after probes.
8. Generate `comparison.html`, inspect side-by-side and overlay modes, and iterate on the largest visible differences.

For long pages, compare the first viewport plus representative section-level screenshots rather than relying on one scaled full-page image. For dynamic or personalized content, document unavoidable differences.

## Final Check

Before responding:

- Run syntax/validation checks for modified scripts and skill metadata.
- Open or render the HTML output enough to catch broken layout or missing sections.
- Confirm `DESIGN.md`, `design-system.html`, and icon outputs are in sync.
- Confirm reference screenshots, reconstruction screenshots, and `comparison.html` use identical viewport dimensions for each tested responsive condition.
- Confirm the reconstruction uses extracted assets instead of placeholder approximations wherever possible.
- Confirm full `<picture>` mappings, actual selected sources, and gallery/service item counts.
- Confirm no broad descendant selector changes nested logos or controls into full-bleed media.
- Run asset URL validation and reconstruction audit; treat blank images, placeholders, overlaps, and unexplained count differences as failures.
- Confirm browser and MCP test processes exit cleanly.
- Confirm the final `design-package/START-HERE.md`, `AGENT-HANDOFF.md`, and `manifest.json` exist and use only relative internal paths.
- State any evidence gaps, such as login-only pages, blocked assets, or missing interaction states.
