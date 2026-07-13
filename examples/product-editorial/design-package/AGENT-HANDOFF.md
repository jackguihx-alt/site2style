# Agent Handoff: Product Editorial Example

Package ID: `design-language-0dd741359bac`
Package type: `website-design-language`
Source reference: `https://example.com/fictional-product`

## Session contract

This file is the only required entry point for a new AI session. The design package is already extracted and measured. Do not browse or re-extract the reference site unless the user requests a refresh or an evidence gap blocks the task.

## Read order

1. Read `STYLE.md` completely. It is the transferable design-language source of truth.
2. Read `style-profile.json` only when exact measurements, responsive values, or confidence need verification.
3. Open `style-board.html` when visual review is available.
4. Read `advanced/` only for implementation detail. Read `evidence/` only to audit a claim.

## Apply to the new task

Before implementation, identify:

- New audience.
- Primary user task or conversion goal.
- Required content and information architecture.
- Assets the user owns or is allowed to use.
- Target platforms and responsive conditions.

Then:

1. Preserve the measured hierarchy, rhythm, density, contrast, shape, imagery direction, motion restraint, and responsive transformations in `STYLE.md`.
2. Follow every `retain / reinterpret / replace` boundary.
3. Create an original structure for the new task. Do not reproduce the source page order by default.
4. Replace source branding, names, copy, icons, photography, fonts, and campaign concepts unless the user provides rights to them.
5. Validate desktop and mobile hierarchy, image framing, text fit, contrast, focus states, asset health, and adherence to `STYLE.md`.

## Response requirement

State which package ID was used, what was retained, what was reinterpreted, what was replaced, and any evidence limitation that affected the result.
