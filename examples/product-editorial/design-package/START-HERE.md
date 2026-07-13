# Start Here: Product Editorial Example

Package ID: `design-language-0dd741359bac`

This folder is a portable design-language package. It can be moved into another project or opened in a later AI session without the original chat history.

## Choose one entry point

| You are | Open |
| --- | --- |
| A designer or product owner | `START-HERE.html` |
| An AI Agent starting a new session | `AGENT-HANDOFF.md` |
| A developer reading the rules | `STYLE.md` |
| A tool or automated workflow | `manifest.json` and `style-profile.json` |

## Reuse in another session

Move this entire folder into the new project, then tell the Agent:

> Read `AGENT-HANDOFF.md` in this design package. Apply it to my new task, preserve the transfer boundaries, and do not re-extract the source website unless the package says evidence is missing.

The Agent should ask for or infer only the new audience, primary task, content, and owned assets. The reference-site conversation is not required.

## Files you can ignore initially

- `advanced/`: detailed design-system and icon material, when included.
- `evidence/`: raw browser evidence and screenshots, when included.

## Evidence gaps

- No interaction-state evidence was captured.

## Rights boundary

This package transfers design rules, not ownership. Source branding, copy, photography, fonts, icons, campaign concepts, and other protected assets must be replaced unless separately licensed.
