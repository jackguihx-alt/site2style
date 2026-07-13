# Portable Browser Setup

Use this reference only when browser extraction is unavailable or an Agent needs connection instructions.

## Architecture

The project has no required Agent vendor or private browser plugin.

1. The CLI and MCP server call the same extraction script.
2. The extraction script tries Playwright first.
3. If Playwright cannot launch, it falls back to a system Chrome, Chromium, or Edge browser through the Chrome DevTools Protocol.
4. `agent-browser` remains a legacy final fallback.

The browser executable is an external runtime dependency. It is intentionally not committed to the repository or bundled in release archives.

## Install

Requirements: Node.js 20 or newer.

```bash
npm install
npm run doctor
```

If the doctor finds no usable system browser, install Playwright Chromium:

```bash
npx playwright install chromium
npm run doctor
```

Users who already have Google Chrome, Chromium, or Microsoft Edge normally do not need a browser download.

## CLI Interface

```bash
html2style doctor
html2style extract https://example.com evidence.json --profile full
```

Browser selection can be forced for debugging:

```bash
html2style extract https://example.com evidence.json --backend playwright
html2style extract https://example.com evidence.json --backend chrome
```

The default `auto` mode tries every detected backend in order and records failed attempts in the evidence JSON.

## MCP Interface

For any MCP-compatible Agent, configure a local stdio server:

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

Then call:

1. `browser_doctor`
2. `extract_website_evidence`
3. `extract_icon_library` when icons are present
4. `render_design_preview` after writing `DESIGN.md`
5. `validate_asset_urls` after building a reconstruction
6. `audit_reconstruction` with original and replica evidence
7. `render_visual_comparison` at identical viewport dimensions

Different MCP clients store configuration in different locations. Keep the server command and arguments unchanged; only the surrounding client configuration location varies.

## Login-Gated Pages

Use a visible temporary browser and provide a fixed login window:

```bash
html2style extract https://example.com evidence.json --headed --login-wait 60
```

The user signs in directly in the browser window. Never request credentials in chat or automate MFA bypass. The temporary browser profile is deleted after extraction.

For Playwright, authenticated storage from the first viewport is carried into the remaining responsive contexts. For Chrome/CDP, viewports share the same temporary browser profile.

## Responsive Profiles

- `full`: five viewports covering desktop/tablet tall and short variants plus mobile. Use for high-fidelity work.
- `standard`: desktop, tablet, and mobile.
- `minimal`: desktop and mobile only.

Use `full` when the page uses `<picture>` media conditions based on viewport height as well as width.

## Troubleshooting

### Browser detected but launch fails

Run the doctor, then force the system browser:

```bash
html2style extract https://example.com evidence.json --backend chrome
```

Automatic mode already falls back from Playwright to the system browser. The final evidence records `attemptedBackends` and `backendErrors`.

### Dynamic content is missing

- Retry in headed mode.
- Increase `--login-wait` when the page requires user action.
- Check whether content appears only after consent, geolocation, personalization, or an authenticated API response.
- Record inaccessible states instead of inventing evidence.

### Assets are blocked

Keep the URL and failure in the asset manifest. Do not silently replace brand imagery or icons with approximations during a fidelity test.

### Agent has neither shell nor MCP access

The Agent cannot run browser extraction itself. A human can run the CLI and provide `evidence.json` plus its artifacts directory; the Agent can then complete the design-system workflow from those files.
