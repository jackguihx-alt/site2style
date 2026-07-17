# Website Design Extraction

Read `SKILL.md` when the user asks to inspect, extract, transfer, document, or recreate a website design system.

Use the repository CLI or MCP server rather than assuming a Claude-specific browser integration exists. Start with `html2style doctor` and collect the `full` responsive profile. For style extraction, generate `style-profile.json`, synthesize `STYLE.md`, render `style-board.html`, then run `html2style skill` so the final result is a reusable design-style Skill with `SKILL.md` and `assets/preview.html`. For complete replicas, read `references/high-fidelity-reconstruction.md`, run asset validation, and audit original versus replica evidence at identical viewports before declaring completion.
