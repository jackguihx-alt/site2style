import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("design preview renders a STYLE package", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "website-style-preview-"));
  const input = path.join(temp, "STYLE.md");
  const output = path.join(temp, "style-board.html");
  await fs.writeFile(input, `# STYLE: Quiet Product Editorial

## 0. Source & Confidence

| Item | Evidence |
| --- | --- |
| Source URL | https://example.com |

## 1. Style In One Sentence

A quiet product-first system with sparse copy and dominant imagery.

## 2. Design DNA

| Dimension | Observation | Measured evidence | Transferable rule | Confidence |
| --- | --- | --- | --- | --- |
| Hierarchy | One focal idea | 56px display | Keep one focal message | High |

## 4. Color Logic

| Role | Measured value | Paired with | Usage rule |
| --- | --- | --- | --- |
| Primary foreground | rgb(29,29,31) | White | Headlines |
| Action | rgb(0,113,227) | White | Primary commands |

## 5. Typography Grammar

| Role | Family | Desktop | Tablet | Mobile | Weight / line height | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| Display | system-ui | 56px | 48px | 32px | 600 / 1.1 | Short titles |

## 9. Responsive Transformations

| Condition | What stays invariant | What transforms |
| --- | --- | --- |
| Small | One focal idea | 32px display |

## 10. Do / Don't

### Do

- Use authored imagery.

### Don't

- Do not copy source assets.

## 11. Transfer Prompt

Create an original product site using these measured principles.
`, "utf8");

  const script = fileURLToPath(new URL("../scripts/render-design-preview.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, input, output], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const html = await fs.readFile(output, "utf8");
  assert.match(html, /Quiet Product Editorial/);
  assert.match(html, /rgb\(0,113,227\)/);
  assert.match(html, /Create an original product site/);
  assert.match(html, /56px • 600 • 61\.6px/);
  assert.doesNotMatch(html, /line-height:600px/);
});
