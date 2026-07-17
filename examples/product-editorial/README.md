# Product Editorial Example

This fictional example demonstrates the default design-style Skill output without redistributing a real website's branding or assets.

- Give `product-editorial-style/` to an Agent as one reusable Skill.
- Agents start from `product-editorial-style/SKILL.md`.
- Humans open `product-editorial-style/assets/preview.html`.
- Full rules and measured data live under `product-editorial-style/references/`.

The legacy `design-package/` remains as an expanded evidence-handoff example for automation and archival use.

Regenerate the visual board from the repository root:

```bash
node bin/html2style.mjs preview \
  examples/product-editorial/design-package/STYLE.md \
  examples/product-editorial/design-package/style-board.html
```

Regenerate the design-style Skill:

```bash
node bin/html2style.mjs skill \
  examples/product-editorial/product-editorial-style \
  --style examples/product-editorial/design-package/STYLE.md \
  --profile examples/product-editorial/design-package/style-profile.json \
  --preview examples/product-editorial/design-package/style-board.html \
  --name "Product Editorial" \
  --locale zh-CN
```

The example intentionally contains no photography. A real transfer implementation should use owned, licensed, or newly created visual assets.
