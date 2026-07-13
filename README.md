# HTML2Style

[Project page (中文 / English)](docs/index.html) · [Open the output example](examples/product-editorial/design-package/START-HERE.html)

![HTML2Style bilingual project page](https://raw.githubusercontent.com/jackguihx-alt/html2style/main/docs/assets/homepage.png)

**One site in. A reusable design evidence package out.**

`html2style` captures rendered pages across responsive conditions, measures their visual system, and turns the evidence into files that another Agent can inspect, apply, and verify. It is designed for style extraction first, with optional full design-system documentation and reconstruction auditing.

Despite the name, the input can be a live URL, a local HTML file, or a manually authenticated browser session. “HTML” means the rendered web interface, not static source alone.

```text
URL -> browser evidence -> STYLE.md + profile + board -> design-package/
                                                      \-> reuse in any later Agent session
```

## The problem

“Make it look like this website” is underspecified.

- Screenshots show pixels, but hide typography rules, responsive sources, crop behavior, and interaction states.
- DOM scrapers miss computed styles, JavaScript-rendered content, SVG systems, and viewport-height media queries.
- A prompt such as “Apple style” often collapses into superficial whitespace, black text, and blue buttons.
- Agent-specific browser tools make a workflow difficult to reuse in another editor or model.
- A convincing desktop screenshot can still hide broken mobile layouts, missing sections, wrong assets, and incorrect icon geometry.

This project captures the evidence and makes the design reasoning portable.

## The story: from imitation to a portable design language

This project started with a deceptively simple request: reproduce a polished product website as accurately as possible.

The first result looked plausible from a distance. It had similar colors, large headings, generous whitespace, and rounded actions. But closer inspection exposed the real failures: icons were missing, image crops were wrong, repeated cards had inconsistent geometry, mobile artwork used the wrong source, and the page stopped before the original experience was complete.

More prompting did not solve the underlying problem. The Agent had pixels and impressions, but not the system behind them.

That failure produced a different workflow:

1. **Observe:** render the live page across width and height conditions.
2. **Measure:** capture computed type, color, spacing, geometry, assets, icons, structure, and interaction evidence.
3. **Distill:** separate deterministic measurements from Agent-authored design rules.
4. **Transfer:** preserve hierarchy, rhythm, density, imagery, and responsive logic while replacing source identity and protected assets.
5. **Package:** create one portable folder that another Agent can reuse without the original conversation.

The important test was no longer “Can an Agent copy this page?” It became:

> Can an Agent explain why the design works, carry those principles into a different product, and prove which parts were measured rather than guessed?

`html2style` is the open-source answer to that question. It does not treat a screenshot as a design system or a brand as a style preset. It turns browser evidence into rules, transfer boundaries, and a reusable handoff.

## What it produces

The primary result is one portable folder:

```text
design-package/
├── START-HERE.md       # human entry point
├── START-HERE.html     # double-click entry point
├── AGENT-HANDOFF.md    # new-session Agent entry point
├── manifest.json       # machine entry point
├── STYLE.md
├── style-board.html
├── style-profile.json
├── advanced/           # optional DESIGN.md, board, icons
└── evidence/           # optional raw evidence and screenshots
```

| Output | Purpose |
| --- | --- |
| `START-HERE.html` / `START-HERE.md` | Double-click and GitHub-friendly instructions for every role |
| `AGENT-HANDOFF.md` | Makes the result reusable across sessions without chat history |
| `manifest.json` | Stable package ID, relative entry points, file roles, and evidence gaps |
| `evidence.json` + screenshots | Rendered DOM, computed styles, responsive assets, image geometry, SVGs, structure, and interaction evidence |
| `style-profile.json` | Deterministic visual signals that tools can consume without interpreting prose |
| `STYLE.md` | Transferable hierarchy, rhythm, density, color, shape, image, motion, and responsive rules |
| `style-board.html` | A visual review surface for the style package |
| `DESIGN.md` + `design-system.html` | Detailed tokens, components, page patterns, icon system, and reconstruction guidance |
| Icon library | Searchable HTML, JSON metadata, and standalone SVG files |
| Audit reports | Asset health, structure, responsive parity, and screenshot comparison |

See the copyright-safe [product editorial example](examples/product-editorial/README.md).

## Five-minute start

Requirements: Node.js 20+ and Chrome, Chromium, Edge, or Playwright Chromium.

```bash
npm install
npm run doctor

node bin/html2style.mjs extract https://example.com evidence.json --profile full
node bin/html2style.mjs profile evidence.json style-profile.json --markdown STYLE-measurements.md
cp assets/STYLE.template.md STYLE.md
```

Ask your Agent to read `SKILL.md`, `STYLE-measurements.md`, and `assets/STYLE.template.md`, then synthesize `STYLE.md`. Every important design rule should cite its measured support and confidence. Render the result:

```bash
node bin/html2style.mjs preview STYLE.md style-board.html
node bin/html2style.mjs bundle design-package \
  --style STYLE.md \
  --profile style-profile.json \
  --board style-board.html \
  --measurements STYLE-measurements.md \
  --evidence evidence.json
```

`STYLE-measurements.md` is deterministic evidence; `STYLE.md` is the Agent-authored interpretation.

To reuse the result in another project or Session, move the whole `design-package/` folder and say:

```text
Read design-package/AGENT-HANDOFF.md and apply this design language to my new task.
Do not re-extract the reference unless the package reports missing evidence.
```

If no browser is detected:

```bash
npx playwright install chromium
```

For a login-gated page, use a visible temporary browser profile and sign in manually:

```bash
node bin/html2style.mjs extract https://example.com evidence.json --headed --login-wait 60
```

The project does not request or store credentials.

## Three workflows

### 1. Extract a transferable style

Use this when the goal is to understand a reference or apply its design logic to a different product.

1. Capture the `full` responsive profile.
2. Generate `style-profile.json` and `STYLE-measurements.md`.
3. Synthesize `STYLE.md` with observation, measurement, rule, and confidence separated.
4. Mark source material as `retain`, `reinterpret`, or `replace`.
5. Render and review `style-board.html`.
6. Bundle the outputs into `design-package/` and deliver that folder as the single result.

The result describes how the design works without treating source branding, copy, icons, or photography as reusable style.

### 2. Document a complete design system

Use `assets/DESIGN.template.md` to create `DESIGN.md`, then render it:

```bash
node bin/html2style.mjs icons --from-evidence evidence.json --out icons
node bin/html2style.mjs preview DESIGN.md design-system.html
```

This mode adds component states, page patterns, icon evidence, content voice, and implementation anchors.

### 3. Verify a reconstruction

Use this only when replication is permitted and intended:

```bash
node bin/html2style.mjs assets replica.html --base-url https://example.com
node bin/html2style.mjs extract ./replica.html replica-evidence.json --profile full
node bin/html2style.mjs audit evidence.json replica-evidence.json --mode complete
node bin/html2style.mjs compare original.png replica.png comparison.html
```

The complete audit checks viewport coverage, document height, structural counts, gallery order, footer groups, placeholders, broken media, responsive source mappings, and separate owner/rendered/intrinsic image geometry.

## Responsive evidence

The default `full` profile captures width and height variants because responsive artwork may depend on both:

| Name | Viewport | Typical source |
| --- | ---: | --- |
| desktop | 1440×900 | large/tall |
| desktop-short | 1440×720 | large/short |
| tablet | 1024×768 | medium/tall |
| tablet-short | 1024×700 | medium/short |
| mobile | 390×844 | small/mobile |

Use `--profile standard` for three viewports or `--profile minimal` for desktop and mobile. Record skipped conditions as evidence gaps.

## Works across Agents

There is no universal Skill discovery format, so the same workflow is exposed through independent layers:

| Interface | Who can use it |
| --- | --- |
| CLI | Any Agent or human with shell access |
| MCP stdio server | Any MCP-compatible client |
| `SKILL.md` | Skill-aware Agents |
| `AGENTS.md` | Coding Agents that read repository instructions |
| `CLAUDE.md` | Claude Code |
| `.cursor/rules` | Cursor |
| Copilot instructions | GitHub Copilot |
| Portable prompt | Other Agents that accept project instructions |

The runtime automatically tries Playwright, a locally installed Chrome/Chromium/Edge browser, and then the legacy `agent-browser` CLI. No Codex, Claude, Cursor, or other vendor browser capability is required.

## MCP setup

```bash
npm run mcp
```

```json
{
  "mcpServers": {
    "html2style": {
      "command": "node",
      "args": ["/absolute/path/to/html2style/mcp/server.mjs"]
    }
  }
}
```

Tools: `browser_doctor`, `extract_website_evidence`, `extract_style_profile`, `bundle_design_package`, `extract_icon_library`, `render_design_preview`, `render_visual_comparison`, `validate_asset_urls`, and `audit_reconstruction`.

See [the example MCP configuration](integrations/mcp.example.json) and [portable Agent prompt](integrations/portable-agent-prompt.md).

## Why this is different

- **Evidence before interpretation:** measured profiles remain separate from Agent-authored design rules.
- **Responsive by default:** width, height, `<picture>` mappings, selected sources, and rendered geometry are captured explicitly.
- **Transfer boundaries:** the style workflow distinguishes reusable principles from protected source identity and assets.
- **Human and machine outputs:** JSON supports automation; Markdown supports Agents; HTML supports visual review.
- **Verification is part of the workflow:** asset checks and reconstruction audits prevent a polished first viewport from masking incomplete work.
- **Portable runtime:** CLI and MCP are the product interfaces; vendor adapters are optional discovery aids.

## Related work and scope

Website design extraction is an active category. These adjacent projects are useful references for choosing the right tool:

- [Website to Design](https://websitetodesign.com/) imports websites as editable Figma designs.
- [DesignDNA](https://www.designdna.site/) is a browser extension that exports design-system files for coding tools.
- [Dembrandt](https://github.com/thevangelist/dembrandt) extracts design tokens, brand signals, and `DESIGN.md` through a CLI and MCP server.
- [brandmd](https://github.com/yuvrajangadsingh/brandmd) extracts a multi-page design system into agent-readable formats.

HTML2Style focuses on a different handoff problem: preserving responsive browser evidence, separating measurements from interpretation, marking what may or may not be transferred, auditing reconstruction completeness, and delivering the result as one cross-session package. It does not import a page into Figma, claim ownership of captured material, or treat third-party brand assets as reusable output.

## Responsible use

The MIT license applies to this project's code and templates, not to content captured from third-party websites.

- Review website terms, copyright, trademark, robots policy, and applicable law.
- Do not publish captured credentials, personal data, private page text, or session material.
- Do not redistribute source photography, fonts, logos, icons, copy, or distinctive campaign assets without permission.
- Prefer owned, licensed, or newly created assets for design-language transfer.
- Treat evidence from login-gated pages as sensitive unless the owner has approved publication.

## Project status

Version `0.5.0` is an early public release. Static and JavaScript-rendered sites are supported. Authentication can be handled through manual login. Complex canvas/WebGL content, closed shadow roots, anti-bot challenges, video timelines, and every possible interaction state are not fully captured; report those as evidence gaps rather than inferring them.

## Development

```bash
npm test
npm run validate
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Report security issues according to [SECURITY.md](SECURITY.md).

## License

MIT. Captured website content and assets retain their original owners' rights.
