<p align="right">中文 | <a href="README_EN.md">English</a></p>

# HTML2Style

**输入一个网站，输出一套可复用的设计证据包。**

`html2style` 会在不同响应式条件下采集网页的真实渲染结果，测量它的视觉系统，并把证据整理成其他 Agent 可以读取、应用和验证的文件。它首先解决风格提取与迁移，也可以进一步生成完整的设计系统文档并审计网页复刻质量。

名字虽然叫 HTML2Style，但输入不只限于静态 HTML：你可以提供线上 URL、本地 HTML 文件，或在可见浏览器中手动登录后的页面。这里的“HTML”代表浏览器最终渲染出来的界面，而不只是源代码。

```text
URL -> 浏览器证据 -> STYLE.md + profile + board -> design-package/
                                                    \-> 在之后任意 Agent session 中复用
```

## 为什么需要它

“做得像这个网站”并不是一个足够明确的需求。

- 截图只展示像素，看不到字体规则、响应式资源、图片裁切方式和交互状态。
- 普通 DOM 抓取会遗漏计算样式、JavaScript 渲染内容、SVG 系统和视口高度媒体查询。
- “Apple 风格”这类提示词很容易退化成留白、黑字和蓝色按钮，无法保留真正的设计逻辑。
- 绑定某个 Agent 的浏览器能力，很难在其他编辑器、模型或 session 中复用。
- 一张看起来不错的桌面截图，仍可能掩盖移动端错位、页面缺失、图片错误和图标尺寸不一致。

HTML2Style 采集这些证据，并把设计判断变成可以跨 Agent 交接的文件。

## 项目故事：从复刻网页到迁移设计语言

这个项目起源于一个看似简单的任务：尽可能准确地复刻一个成熟的产品网站。

第一版远看似乎没问题：颜色接近、标题很大、留白充足、按钮也有圆角。但仔细对照后，真正的问题全部暴露出来了：图标缺失、图片裁切错误、重复卡片尺寸不一致、移动端使用了错误素材，而且页面并没有完整复刻。

继续追加提示词没有解决根本问题。Agent 看到了像素和印象，却没有拿到这些设计背后的系统。

因此，我们重新设计了整个流程：

1. **观察：** 在不同宽度和高度条件下渲染真实页面。
2. **测量：** 采集字体、颜色、间距、几何、资源、图标、结构与交互证据。
3. **提炼：** 将确定性测量与 Agent 总结的设计规则分开保存。
4. **迁移：** 保留层级、节奏、密度、图片策略和响应式逻辑，同时替换原站身份与受保护素材。
5. **打包：** 生成一个完整文件夹，让另一个 Agent 无需读取旧聊天记录即可复用。

最终的判断标准不再是“Agent 能否抄出这个页面”，而是：

> Agent 能否解释这个设计为什么成立，把设计原则迁移到另一个产品，并说明哪些结论来自测量、哪些只是推断？

`html2style` 是我们对这个问题的开源回答。它不会把一张截图当作设计系统，也不会把某个品牌直接当作风格预设；它把浏览器证据转化为设计规则、迁移边界和可复用的交接包。

## 会生成什么

主要产物是一个可整体移动的文件夹：

```text
design-package/
├── START-HERE.md       # GitHub / 人类入口
├── START-HERE.html     # 双击打开的可视化入口
├── AGENT-HANDOFF.md    # 新 session 的 Agent 入口
├── manifest.json       # 机器入口
├── STYLE.md
├── style-board.html
├── style-profile.json
├── advanced/           # 可选：DESIGN.md、设计板、图标库
└── evidence/           # 可选：原始证据与截图
```

| 产物 | 用途 |
| --- | --- |
| `START-HERE.html` / `START-HERE.md` | 告诉不同角色应该先打开什么、接下来做什么 |
| `AGENT-HANDOFF.md` | 让新 session 无需旧聊天记录也能继续工作 |
| `manifest.json` | 提供稳定 package ID、相对路径、文件角色和证据缺口 |
| `evidence.json` + 截图 | 保存渲染 DOM、计算样式、响应式资源、图片几何、SVG、结构和交互证据 |
| `style-profile.json` | 工具可直接读取、不依赖自然语言解释的确定性视觉信号 |
| `STYLE.md` | 可迁移的层级、节奏、密度、颜色、形状、图片、动效和响应式规则 |
| `style-board.html` | 供人类检查风格包的可视化页面 |
| `DESIGN.md` + `design-system.html` | 更完整的 Token、组件、页面模式、图标系统和复刻指南 |
| 图标库 | 可搜索 HTML、JSON 元数据和独立 SVG 文件 |
| 审计报告 | 检查资源健康、页面结构、响应式一致性和截图差异 |

仓库中提供了一个不包含第三方版权素材的[产品编辑风格示例](examples/product-editorial/README.md)。

## 五分钟上手

环境要求：Node.js 20+，以及 Chrome、Chromium、Edge 或 Playwright Chromium。

```bash
npm install
npm run doctor

node bin/html2style.mjs extract https://example.com evidence.json --profile full
node bin/html2style.mjs profile evidence.json style-profile.json --markdown STYLE-measurements.md
cp assets/STYLE.template.md STYLE.md
```

让你的 Agent 阅读 `SKILL.md`、`STYLE-measurements.md` 和 `assets/STYLE.template.md`，然后生成 `STYLE.md`。每条重要设计规则都应该标注测量依据和置信度。接着渲染并打包：

```bash
node bin/html2style.mjs preview STYLE.md style-board.html
node bin/html2style.mjs bundle design-package \
  --style STYLE.md \
  --profile style-profile.json \
  --board style-board.html \
  --locale zh-CN \
  --measurements STYLE-measurements.md \
  --evidence evidence.json
```

`STYLE-measurements.md` 是确定性证据，`STYLE.md` 是 Agent 基于证据做出的设计解释。

需要在其他项目或 session 中复用时，移动整个 `design-package/` 文件夹，然后告诉 Agent：

```text
阅读 design-package/AGENT-HANDOFF.md，并把这套设计语言应用到我的新任务。
除非交接包明确提示证据缺失，否则不要重新采集参考网站。
```

如果没有检测到浏览器：

```bash
npx playwright install chromium
```

如果页面需要登录，可以开启临时可见浏览器并手动登录：

```bash
node bin/html2style.mjs extract https://example.com evidence.json --headed --login-wait 60
```

项目不会请求或保存账号密码。

## 三种工作流

### 1. 提取可迁移风格

适用于理解参考网站，或把它的设计逻辑迁移到另一个产品。

1. 使用 `full` 响应式配置采集页面。
2. 生成 `style-profile.json` 和 `STYLE-measurements.md`。
3. 将观察、测量、规则与置信度分开，生成 `STYLE.md`。
4. 把原站内容标记为 `retain`、`reinterpret` 或 `replace`。
5. 渲染并检查 `style-board.html`。
6. 将结果打包到 `design-package/`，并把整个文件夹作为唯一交付物。

最终结果描述的是设计如何运作，而不是把原站品牌、文案、图标或摄影素材当成可以直接复用的风格。

### 2. 生成完整设计系统文档

使用 `assets/DESIGN.template.md` 创建 `DESIGN.md`，然后渲染：

```bash
node bin/html2style.mjs icons --from-evidence evidence.json --out icons
node bin/html2style.mjs preview DESIGN.md design-system.html
```

这个模式会补充组件状态、页面模式、图标证据、内容语气和实现参考。

### 3. 验证网页复刻

仅在你有权复刻且任务确实要求复刻时使用：

```bash
node bin/html2style.mjs assets replica.html --base-url https://example.com
node bin/html2style.mjs extract ./replica.html replica-evidence.json --profile full
node bin/html2style.mjs audit evidence.json replica-evidence.json --mode complete
node bin/html2style.mjs compare original.png replica.png comparison.html
```

完整审计会检查视口覆盖、文档高度、结构数量、画廊顺序、页脚分组、占位内容、损坏媒体、响应式资源映射，以及图片容器、渲染尺寸和原始尺寸。

## 响应式证据

默认 `full` 配置同时采集宽度和高度变化，因为响应式图片可能同时依赖这两个条件：

| 名称 | 视口 | 常见资源条件 |
| --- | ---: | --- |
| desktop | 1440×900 | 大屏 / 高视口 |
| desktop-short | 1440×720 | 大屏 / 短视口 |
| tablet | 1024×768 | 中屏 / 高视口 |
| tablet-short | 1024×700 | 中屏 / 短视口 |
| mobile | 390×844 | 小屏 / 移动端 |

使用 `--profile standard` 可采集三个视口，使用 `--profile minimal` 只采集桌面和移动端。未采集的条件应该记录为证据缺口，而不是由 Agent 猜测。

## 适用于不同 Agent

目前没有所有 Agent 通用的 Skill 发现格式，因此同一套工作流通过多个独立入口提供：

| 接口 | 适用对象 |
| --- | --- |
| CLI | 任何拥有终端权限的 Agent 或用户 |
| MCP stdio server | 任何兼容 MCP 的客户端 |
| `SKILL.md` | 支持 Skill 的 Agent |
| `AGENTS.md` | 会读取仓库指令的 Coding Agent |
| `CLAUDE.md` | Claude Code |
| `.cursor/rules` | Cursor |
| Copilot instructions | GitHub Copilot |
| Portable prompt | 可以接收项目指令的其他 Agent |

运行时会依次尝试 Playwright、本机安装的 Chrome / Chromium / Edge，以及兼容旧环境的 `agent-browser` CLI。它不依赖 Codex、Claude、Cursor 或其他厂商专属的浏览器能力。

### 语言与全球化

- Skill 根据用户当前使用的语言决定交付语言；中文用户默认生成中文说明。
- `html2style bundle` 默认使用 `zh-CN`，国外用户可以传入 `--locale en`。
- `START-HERE.md`、`START-HERE.html` 和 `AGENT-HANDOFF.md` 会本地化。
- CLI 命令、MCP 工具名、文件名和 JSON 字段始终保持英文，保证跨地区自动化兼容。
- 原网站内容和测量证据保持原文；除非用户明确要求，否则不会自动翻译采集内容。

## MCP 配置

```bash
npm run mcp
```

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

提供的工具包括：`browser_doctor`、`extract_website_evidence`、`extract_style_profile`、`bundle_design_package`、`extract_icon_library`、`render_design_preview`、`render_visual_comparison`、`validate_asset_urls` 和 `audit_reconstruction`。

更多内容见 [MCP 配置示例](integrations/mcp.example.json)和[通用 Agent 提示词](integrations/portable-agent-prompt.md)。

## 它与其他工具有什么不同

- **先证据、后解释：** 测量结果与 Agent 总结的设计规则分别保存。
- **默认覆盖响应式：** 明确采集宽度、高度、`<picture>` 映射、实际选中资源和渲染几何。
- **明确迁移边界：** 区分可以复用的设计原则与必须替换的原站身份和素材。
- **同时服务人和机器：** JSON 用于自动化，Markdown 用于 Agent，HTML 用于视觉评审。
- **验证属于工作流的一部分：** 资源检查与复刻审计可以避免一个漂亮首屏掩盖未完成页面。
- **运行时可移植：** CLI 和 MCP 是核心产品接口，厂商适配文件只是可选发现入口。

## 相关项目与范围

网站设计提取是一个活跃领域。以下相邻项目适合用来判断你需要哪类工具：

- [Website to Design](https://websitetodesign.com/) 将网站导入为可编辑的 Figma 设计。
- [DesignDNA](https://www.designdna.site/) 是一个浏览器扩展，可以导出供编码工具使用的设计系统文件。
- [Dembrandt](https://github.com/thevangelist/dembrandt) 通过 CLI 和 MCP 提取设计 Token、品牌信号与 `DESIGN.md`。
- [brandmd](https://github.com/yuvrajangadsingh/brandmd) 将多页面设计系统提取为 Agent 可读格式。

HTML2Style 解决的是不同的交接问题：保留响应式浏览器证据、分离测量与解释、标记哪些内容可以迁移或必须替换、审计完整复刻范围，并把所有内容交付为一个可跨 session 使用的文件夹。它不会把网页导入 Figma，不会声称拥有被采集内容，也不会把第三方品牌素材当作可复用输出。

## 负责任地使用

MIT License 只适用于本项目的代码和模板，不适用于从第三方网站采集的内容。

- 请检查网站条款、版权、商标、robots policy 和适用法律。
- 不要发布账号凭据、个人数据、私有页面文本或 session 信息。
- 未经允许，不要重新分发原站摄影、字体、Logo、图标、文案或独特 campaign 素材。
- 迁移设计语言时，优先使用自有、已授权或重新创作的素材。
- 除非页面所有者明确允许公开，否则应把登录后采集的证据视为敏感信息。

## 项目状态

版本 `0.5.0` 是早期公开版本。当前支持静态网站和 JavaScript 渲染网站，也可以通过手动登录处理鉴权页面。复杂 Canvas / WebGL 内容、closed shadow root、反爬挑战、视频时间线和所有可能的交互状态还无法完整采集；遇到这些情况时应记录为证据缺口，而不是自动推断。

## 开发

```bash
npm test
npm run validate
```

提交改动前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请按照 [SECURITY.md](SECURITY.md) 提交。

## License

MIT。被采集网站的内容和素材仍归其原权利人所有。
