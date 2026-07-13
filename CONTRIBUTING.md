# Contributing

Contributions that improve extraction accuracy, portability, evidence quality, or validation are welcome.

## Before opening a change

1. Search existing issues and keep each change focused.
2. Do not commit third-party website screenshots, fonts, logos, icons, copy, or product images unless redistribution is clearly permitted.
3. Use a local fixture or a fictional example for regression tests.
4. Preserve the CLI and MCP as Agent-neutral interfaces; vendor-specific adapters must remain optional.
5. Add a focused test for bug fixes and new machine-readable behavior.

## Local checks

```bash
npm install
npm test
npm run validate
```

Browser extraction tests use the local responsive fixture and launch an available supported browser. Run `npm run doctor` when the browser test cannot start.

## Pull requests

Describe:

- The user problem and expected behavior.
- The evidence or fixture that reproduces it.
- Any schema, CLI, MCP, or output changes.
- What was tested and which evidence gaps remain.

Avoid unrelated formatting or generated-file churn. Changes to evidence fields should update the CLI/MCP documentation and tests in the same pull request.

## Reporting extraction failures

Include the target URL only when it is public and safe to share. Prefer a minimal HTML fixture that reproduces the issue. Never attach credentials, cookies, browser profiles, or private evidence files.
