# Security Policy

## Supported version

Security fixes are applied to the latest release line.

## Reporting a vulnerability

Do not open a public issue for a vulnerability involving credential exposure, arbitrary file access, command execution, unsafe URL handling, or sensitive evidence leakage. Use the repository owner's private security-reporting channel when available.

Include a minimal reproduction, affected version, impact, and suggested mitigation. Remove cookies, tokens, personal data, private URLs, and captured page content from the report.

## Data handling

- The project does not request or persist credentials.
- Manual login uses a temporary browser profile that is removed after extraction.
- Evidence may contain page text, URLs, DOM fragments, resource hosts, and screenshots. Treat it as sensitive until reviewed.
- Only run extraction against websites and accounts you are authorized to inspect.
