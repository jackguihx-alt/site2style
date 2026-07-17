# Agent Instructions

When a user asks to extract, transfer, document, or reproduce a website's design language, read `SKILL.md` and follow its evidence-first workflow.

Use the platform-neutral interfaces in this repository:

- Shell-capable agents: run `html2style doctor`, then `html2style extract <url> <evidence.json> --profile full`.
- MCP-capable agents: call `browser_doctor`, then `extract_website_evidence`.
- Default to style extraction when the user wants to understand a reference: build `style-profile.json`, synthesize `STYLE.md`, and render `style-board.html`. Stop there unless implementation was requested.
- Before delivery, run `html2style skill` and return the resulting design-style Skill. A human opens `assets/preview.html`; a later Agent session starts from its `SKILL.md`.
- Do not require a Codex, Claude, Cursor, or other vendor-specific browser plugin.
- Read `references/high-fidelity-reconstruction.md` for replication work. Keep viewport, outer container, rendered image, and intrinsic asset geometry separate.
- Read `references/design-language-transfer.md` when creating an original site from a reference style. Preserve design logic while replacing source identity, content, assets, and page architecture.
- Generate `DESIGN.md` from measured evidence and render `design-system.html`.
- For complete replicas, run `html2style assets` and `html2style audit --mode complete`, then compare screenshots at identical viewports. Do not replace full-page scope with a representative sample.
