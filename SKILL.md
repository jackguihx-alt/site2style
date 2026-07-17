---
name: html2style
description: 将一个或多个真实网站转化为有证据、可迁移、可跨 session 复用的设计语言包，并通过 Agent 中立的 CLI 或 MCP 使用。默认中文交付，也支持英文。适用于用户要求提取或学习网站风格、反向分析设计系统、基于参考风格创作新网站、完善 DESIGN.md、采集 Token/素材/组件/图标、复刻获准网站或审计视觉还原度。 Use when the user asks to extract or learn a website style, reverse-engineer a design system, transfer measured design logic without copying a brand, replicate a permitted website, or audit visual fidelity.
---

# HTML2Style

把真实网站转化为可移植的设计证据与可复用视觉规则，使其他 Agent 不依赖原网页、原聊天记录或特定厂商浏览器也能继续使用。

## 语言与全球化

- 中文优先：当用户使用中文或未明确指定语言时，人类可读交付物默认使用 `zh-CN`。
- 国际用户：当用户使用英文或明确要求英文时，使用 `en`。
- 执行 `html2style skill` 时显式传入 `--locale zh-CN` 或 `--locale en`；MCP 的 `create_style_skill` 使用同名 `locale` 参数。
- 本地化生成 Skill 的 `SKILL.md`、`agents/openai.yaml` 和最终用户说明。
- CLI 命令、MCP 工具名、文件名、JSON schema、Token 名称和代码标识符始终保持英文，避免破坏跨地区自动化。
- 原网站文案和测量证据保持原始语言。除非用户明确要求，不要把内容翻译与设计提取混在一起。
- 回复语言跟随用户当前语言，而不是参考网站语言。

Default deliverables / 默认交付物：

- `<style-name>-style/`：默认最终交付的标准 Skill 文件夹，可以复制到新项目或 Agent 的 skills 目录。
- `SKILL.md`：唯一 Agent 入口，说明如何将这套网页风格用于新任务。
- `agents/openai.yaml`：Skill 列表、快捷提示和 UI 元数据。
- `assets/preview.html`：人类可以直接打开的自包含 HTML 风格预览。
- `references/STYLE.md`：可迁移到不同产品或业务场景的完整设计规则。
- `references/style-profile.json`：从浏览器证据生成、支撑风格规则的确定性测量。
- `references/measurements.md`：可选的测量摘要，仅在需要追溯精确依据时读取。
- 旧 `design-package/`：仅在用户需要 manifest、原始证据、自动化入口或完整归档时使用 `html2style bundle` 生成。
- `DESIGN.md`：供 Agent 使用的结构化设计系统事实来源。
- `design-system.html`：使用提取到的 Token 和组件渲染，供人类查看的 HTML 设计系统。
- 图标库：存在图标时，生成可搜索 HTML、`icons-data.json` 和独立 SVG 文件。
- 资源 manifest：图片、背景、字体、SVG、资源 URL 和响应式参考截图。
- 还原度对比：设计系统验证使用代表性样本；用户要求完整复刻时覆盖整个可见页面。
- 设计语言迁移：为新人物、产品或业务创建原创网站，复用测量得到的视觉原则，但不复制原站品牌、内容或专有素材。

优先使用真实页面证据：DOM、计算样式、CSS 变量、网络资源、验证截图和可见交互。不要只凭记忆或截图推断精确 Token；能够提取原始图片、Logo 或图标时，不要用近似占位物替代。

## 开始 / Start

1. 确定模式：
   - 风格提取：用户希望理解或复用视觉语言。只交付风格包，除非用户要求，否则不要额外构建复刻站或新网站。
   - 全新采集：用户提供 URL，创建完整交付物。
   - 补充现有工作：用户提供 `DESIGN.md` 和 URL。先读现有文件、列出缺口，只采集缺失证据。
   - 完整复刻：清点并复现所有可见区块和重复项目，不得静默降级为代表性样本。
   - 设计语言迁移：用户提供参考网站或 `DESIGN.md` 与新用途，使用可迁移设计原则创建原创信息架构和内容系统。
2. 检查工具：
   - 首先运行 `html2style doctor` 或 MCP `browser_doctor`。
   - 页面需要 JavaScript 渲染、登录、计算样式、CSS 变量、SVG sprite、截图或交互状态时，使用内置的 Agent 中立浏览器流程。
   - 宿主 Agent 自带的浏览器工具可以辅助检查，但不能成为这套工作流的必要依赖。
   - 只有公开 HTML 已包含目标内容且不需要精确计算样式时，才使用静态抓取。
   - 浏览器工具不可用时，阅读 `references/browser-tooling-bootstrap.md` 并指导安装，不要对动态页面静默降级。
3. 确定页面和视口范围：
   - 网站明显包含不同页面类型，而用户只提供一个 URL 时，如果能显著改善页面模式覆盖，可请求 2-5 个代表性 URL。
   - 简单单页网站直接使用一个 URL。
   - 默认使用 `full`：桌面高/短、平板高/短和移动端，覆盖同时受宽度与高度控制的响应式图片。
   - 只有速度明显更重要时才使用 `standard` 或 `minimal`，并记录跳过的响应式条件。
   - 对比原站和复刻站时保持视口尺寸完全一致。
4. 安全处理登录：
   - 使用 `--headed --login-wait <seconds>` 打开临时可见浏览器，让用户手动登录。
   - 不要索取凭据、自动绕过 MFA 或替用户选择账号。

## 可移植性约定

- 拥有终端权限的任何 Agent 都可以使用 `html2style` CLI。
- 兼容 MCP 的任何 Agent 都可以使用 `mcp/server.mjs` 中的 stdio server。
- `SKILL.md`、`AGENTS.md` 和厂商适配文件只是发现入口，不是运行时依赖。
- 不得要求 Codex In-app Browser、Claude 浏览器工具、Cursor 浏览器工具或其他厂商专属集成。
- 不捆绑浏览器可执行文件。检测 Playwright 或本机 Chrome / Chromium / Edge；都不存在时提供安装指引。

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
7. Run `html2style skill <style-name>-style --style STYLE.md --profile style-profile.json --preview style-board.html`, including measurements when available.
8. Deliver the generated design-style Skill as the primary result. Tell the human to open `assets/preview.html` and the next Agent to read `SKILL.md`. Stop there unless the user explicitly asks for implementation.

Do not treat a color list or component inventory as a style. A useful style package must explain hierarchy, rhythm, density, contrast, shape, imagery, motion, and responsive transformation.

## Cross-Session Reuse

Generated files are not a usable product until they become a Skill. Prefer one standard design-style Skill over a flat folder of unrelated outputs.

- A human opens `assets/preview.html`.
- A new Agent session starts at `SKILL.md` and reads `references/STYLE.md` as instructed.
- Keep detailed rules and measurements in `references/` so the Agent loads them only when needed.
- Keep HTML previews and optional reusable visual assets in `assets/`.
- Do not include README, installation guides, chat transcripts, raw screenshots, or browser evidence in the default Skill.
- Use the legacy `html2style bundle` only when machine automation or raw evidence archival is explicitly needed.
- Re-extract only when the reference changed or an evidence gap blocks the new task.

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
- `html2style skill <output-dir> --style STYLE.md --profile style-profile.json --preview style-board.html [--measurements STYLE-measurements.md]`: creates the default reusable design-style Skill and HTML preview.
- `html2style bundle <output-dir> --style STYLE.md --profile style-profile.json --board style-board.html [--evidence evidence.json]`: creates the legacy expanded archive for automation or evidence handoff.
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
- Confirm the generated Skill passes Skill validation, `SKILL.md` links use relative paths, and `assets/preview.html` opens without missing content.
- State any evidence gaps, such as login-only pages, blocked assets, or missing interaction states.
