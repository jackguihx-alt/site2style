#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const { outputDir, options } = parseArgs(process.argv.slice(2));
if (!outputDir || !options.style || !options.profile || !options.preview) {
  printUsage();
  process.exit(1);
}

const outputPath = path.resolve(process.cwd(), outputDir);
const input = {
  style: path.resolve(process.cwd(), options.style),
  profile: path.resolve(process.cwd(), options.profile),
  preview: path.resolve(process.cwd(), options.preview),
  measurements: options.measurements ? path.resolve(process.cwd(), options.measurements) : null,
};

await assertMissing(outputPath);
await assertFile(input.style, "STYLE.md");
await assertFile(input.profile, "style-profile.json");
await assertFile(input.preview, "preview HTML");
if (input.measurements) await assertFile(input.measurements, "measurements");

const [styleText, profileText, previewText] = await Promise.all([
  fs.readFile(input.style, "utf8"),
  fs.readFile(input.profile, "utf8"),
  fs.readFile(input.preview, "utf8"),
]);
const profile = parseProfile(profileText);
if (!/<html\b/i.test(previewText)) {
  throw new Error("preview input does not appear to be an HTML document");
}
const packagedPreview = previewText.replace(
  /href=(["'])STYLE\.md\1/g,
  'href="../references/STYLE.md"'
);

const skillName = normalizeSkillName(options.skillName || path.basename(outputPath));
if (path.basename(outputPath) !== skillName) {
  throw new Error(`Output folder must match the Skill name: ${skillName}`);
}
const displayName = clean(options.name) || extractStyleName(styleText) || titleCase(skillName);
const locale = normalizeLocale(options.locale);
const sourceUrl = profile.source?.url ?? null;
const tempPath = path.join(path.dirname(outputPath), `.${path.basename(outputPath)}.tmp-${process.pid}`);

try {
  await Promise.all([
    fs.mkdir(path.join(tempPath, "agents"), { recursive: true }),
    fs.mkdir(path.join(tempPath, "assets"), { recursive: true }),
    fs.mkdir(path.join(tempPath, "references"), { recursive: true }),
  ]);

  await Promise.all([
    fs.writeFile(path.join(tempPath, "SKILL.md"), renderSkill({
      skillName,
      displayName,
      locale,
      sourceUrl,
      hasMeasurements: Boolean(input.measurements),
    }), "utf8"),
    fs.writeFile(path.join(tempPath, "agents/openai.yaml"), renderOpenAiYaml({ skillName, displayName, locale }), "utf8"),
    fs.writeFile(path.join(tempPath, "assets/preview.html"), packagedPreview, "utf8"),
    fs.copyFile(input.style, path.join(tempPath, "references/STYLE.md")),
    fs.copyFile(input.profile, path.join(tempPath, "references/style-profile.json")),
  ]);
  if (input.measurements) {
    await fs.copyFile(input.measurements, path.join(tempPath, "references/measurements.md"));
  }

  await fs.rename(tempPath, outputPath);
  console.log(JSON.stringify({
    outputPath,
    skillName,
    displayName,
    locale,
    sourceUrl,
    entrypoint: path.join(outputPath, "SKILL.md"),
    preview: path.join(outputPath, "assets/preview.html"),
    styleReference: path.join(outputPath, "references/STYLE.md"),
  }, null, 2));
} catch (error) {
  await fs.rm(tempPath, { recursive: true, force: true }).catch(() => {});
  throw error;
}

function parseArgs(args) {
  const [outputDir, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    options[key] = value;
    index += 1;
  }
  return { outputDir, options };
}

function printUsage() {
  console.error(`Usage:
  html2style skill <output-dir> --style STYLE.md --profile style-profile.json --preview style-board.html [options]

Options:
  --name <name>                 Human-readable style name
  --skill-name <name>           Skill name; must match the output folder
  --locale <zh-CN|en>           Skill instruction language (default: zh-CN)
  --measurements <file>         Optional measured Markdown reference`);
}

async function assertMissing(target) {
  try {
    await fs.access(target);
    throw new Error(`Output directory already exists: ${target}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
}

async function assertFile(target, label) {
  const stat = await fs.stat(target).catch(() => null);
  if (!stat?.isFile()) throw new Error(`${label} must be a readable file: ${target}`);
}

function parseProfile(text) {
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value;
  } catch (error) {
    throw new Error(`Invalid style-profile.json: ${error.message}`);
  }
}

function clean(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function normalizeLocale(value) {
  const locale = clean(value) || "zh-CN";
  if (!["zh-CN", "en"].includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}. Use zh-CN or en.`);
  }
  return locale;
}

function normalizeSkillName(value) {
  const normalized = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  if (!normalized) throw new Error("Skill name must contain lowercase Latin letters or digits");
  return normalized;
}

function extractStyleName(text) {
  return clean(text.match(/^#\s+(?:STYLE:\s*)?(.+)$/m)?.[1]);
}

function titleCase(value) {
  return value.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function yamlQuote(value) {
  return JSON.stringify(clean(value));
}

function clip(value, maxLength) {
  const text = clean(value);
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

function renderSkill({ skillName, displayName, locale, sourceUrl, hasMeasurements }) {
  const sourceLine = sourceUrl ? `\`${sourceUrl}\`` : locale === "zh-CN" ? "未记录" : "Not recorded";
  if (locale === "zh-CN") {
    const description = `应用 ${displayName} 的网页设计风格创建或评审新网站和界面。适用于用户要求使用、迁移、延续或检查这套风格时。 Use when the user asks to design or review an interface with the ${displayName} web style.`;
    const measurementsResource = hasMeasurements
      ? "- `references/measurements.md`：测量摘要，需要追溯精确依据时读取。\n"
      : "";
    return `---
name: ${skillName}
description: ${yamlQuote(description)}
---

# ${displayName} 网页风格

使用这套 Skill 为新产品创建网页和界面。迁移设计逻辑，不复制参考网站的品牌身份、文案、图片、Logo、图标或页面结构。

## 使用流程

1. 开始设计前阅读 [完整风格规则](references/STYLE.md)。
2. 需要精确 Token、视口差异或证据时读取 [测量数据](references/style-profile.json)。
3. 需要视觉确认时在浏览器打开 [HTML 风格预览](assets/preview.html)。
4. 根据新产品的目标、内容和用户重新设计信息架构。
5. 实现后同时检查桌面端和移动端的层级、间距、图片裁切、交互状态和可访问性。

## 必须遵守

- 保留 \`references/STYLE.md\` 中的层级、节奏、密度、颜色角色、形状逻辑、图片策略和响应式规则。
- 使用新项目自己的品牌、内容和已授权资产。
- 不要把“风格迁移”理解为复制原页面；组件和页面结构应服务于新任务。
- 测量证据与推断冲突时，以测量证据为准；证据缺失时明确说明，不要编造精确值。
- 参考来源：${sourceLine}。

## 资源

- \`references/STYLE.md\`：Agent 使用的完整设计规则。
- \`references/style-profile.json\`：机器可读的测量结果。
${measurementsResource}- \`assets/preview.html\`：供人类查看的自包含 HTML 预览。
`;
  }

  const description = `Apply the ${displayName} web design style when creating or reviewing websites and interfaces. Use when the user asks to use, transfer, continue, or audit this visual style.`;
  const measurementsResource = hasMeasurements
    ? "- `references/measurements.md`: measured summary for tracing exact evidence.\n"
    : "";
  return `---
name: ${skillName}
description: ${yamlQuote(description)}
---

# ${displayName} Web Style

Use this Skill to create websites and interfaces for new products. Transfer design logic without copying the reference site's identity, copy, imagery, logos, icons, or page structure.

## Workflow

1. Read the [complete style rules](references/STYLE.md) before designing.
2. Read the [measured profile](references/style-profile.json) when exact tokens, viewport differences, or evidence are needed.
3. Open the [HTML style preview](assets/preview.html) in a browser for visual review.
4. Redesign the information architecture around the new product, content, and audience.
5. Validate hierarchy, spacing, image crops, interaction states, and accessibility on desktop and mobile.

## Requirements

- Preserve the hierarchy, rhythm, density, color roles, shape logic, image direction, and responsive rules in \`references/STYLE.md\`.
- Use the new project's own identity, content, and licensed assets.
- Do not treat style transfer as page copying; components and page structure must serve the new task.
- Prefer measured evidence when it conflicts with interpretation. Report evidence gaps instead of inventing exact values.
- Reference source: ${sourceLine}.

## Resources

- \`references/STYLE.md\`: complete design rules for the Agent.
- \`references/style-profile.json\`: machine-readable measurements.
${measurementsResource}- \`assets/preview.html\`: self-contained HTML preview for humans.
`;
}

function renderOpenAiYaml({ skillName, displayName, locale }) {
  const shownName = `${displayName} Style`;
  const shortDescription = locale === "zh-CN"
    ? clip(`使用 ${displayName} 网页风格设计和评审响应式新界面`, 64)
    : clip(`Create and review interfaces with the ${displayName} web style`, 64);
  const defaultPrompt = locale === "zh-CN"
    ? `使用 $${skillName} 为我的产品设计一个新网页，保留这套风格但不要复制原站内容。`
    : `Use $${skillName} to design a new webpage for my product without copying the source content.`;
  return `interface:
  display_name: ${yamlQuote(shownName)}
  short_description: ${yamlQuote(shortDescription)}
  default_prompt: ${yamlQuote(defaultPrompt)}
`;
}
