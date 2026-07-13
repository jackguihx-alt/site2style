# 网站深度提取清单（七遍法）

写 `DESIGN.md` 前按这个清单逐遍做。重点：**第 5 遍图标系统**和**第 6 遍页面范式**是实战里最有 vibe coding 价值的，别跳过。

## 第 0 遍：工具选择与登录态

### 工具选择

- 可先用任意 HTTP 客户端检查原始 HTML。若 HTML 已含目标内容（纯静态页），可先做静态提取。
- 需 DOM/computed style/CSS 变量/SVG sprite/远程资源/登录态时，运行 `site2style doctor`，再用 CLI 或 MCP 采集。
- 不要求 Agent 自带浏览器插件；未发现 Playwright 或系统 Chromium 浏览器时，按 `browser-tooling-bootstrap.md` 引导安装。

### 登录态

- 需登录站点：使用 `--headed --login-wait <seconds>` 打开临时浏览器，让用户手动登录。
- 不要自动填账密 / 绕 MFA / 替用户选账号，遇登录墙停下问。
- 默认不复用用户日常浏览器 profile；临时 profile 在采集结束后删除。

### 截图策略

- 默认不靠截图推断精确值，使用浏览器页面 JS 执行拿 DOM/CSS。
- 截图用于**核对还原度**：原站与复刻页必须使用相同视口条件。
- 复杂 SPA 上全屏截图会卡死，别用。

## 第 1 遍：界定范围

- 页面用途：营销 / 产品 / 控制台 / 文档 / 电商 / 编辑型 / 混合。
- 从上到下列出可见区块。
- 标记登录墙或不可达区域，不凭空补。

## 第 2 遍：采集基线证据

### 采集顺序（CLI/MCP 浏览器流水线）

1. 导航到页面
2. 等待 hydration 和关键网络请求完成
3. 滚动整页触发懒加载和 sticky 态
4. 提取根节点 CSS 变量（token 权威来源）
5. 提取代表性节点 outerHTML
6. 提取这些节点 computed style
7. 提取可见文本和 CTA 文案
8. 通过 DOM/style diff 探测 hover/active/sticky/expanded 态

### 关键原则

- CSS 变量优先于 computed style。站点注入 `--tea-*`/`--td-*` 这类变量是 token 权威值，computed style 是验证用。
- 滚动后再采一次（触发懒加载和 sticky）。
- 别用截图替代第 4-8 步。

## 第 3 遍：提取设计 token

抓可复用规则，不是页面特例：

- primary / accent / surface / text / border / functional（error/warning/success）。
- **同色系可能并存多套**：一个站点可能有品牌色、业务强调色、链接色三种相近颜色，用途不同。别合并，分别记用途和出现位置。
- 浅色 / 深色主题变体（若支持）。
- 字体层级（字号 / 字重 / 行高 / 字间距）。
- 间距节奏（4px 网格？8px？）。
- **圆角逐组件实测**：别用一句话概括（如"完全直角"），不同组件可能不同（按钮 0px / 开关 10px / 徽章 12px）。
- 边框与阴影分层策略（边框分层还是阴影分层？卡片是否有阴影？别假设）。
- 焦点环处理。
- hover 态色差。
- CSS 变量命名规律（`:root` 上的 token 体系）。
- 是否有等宽字体配对（ID / 数值 / 代码）。

> **铁律：采集不能凭记忆**。每个关键 token 值必须用浏览器页面 JS 执行或等价自动化采集实测。

## 第 4 遍：组件与状态

至少检查：导航、按钮、卡片、徽章、表单输入、tab、手风琴、表格、抽屉、弹窗、空状态。

每个组件看：default / hover / active / focus / disabled / 选中 / 展开 / sticky 变体 / 浅深模式变体。

**表单组件常在抽屉/弹窗里**：控制台主页通常只有卡片+编辑按钮，switch/radio/checkbox/select 要点开抽屉才采得到。别只采主页可见的就收工。

**组件可能分多层**：框架原生组件 + 品牌封装 + 业务组件。业务层可能覆盖框架默认，需通过 class、computed style 和 DOM 结构分别确认。

**下拉框不只采触发器**：浮层选项、hover、选中、分组标题、滚动条都要采。

**业务复合组件单列**：控制台常有自研复合布局（分段策略卡、锚点导航卡、悬浮工具条、条件值标签等），比基础组件更有参考价值。记 class 名 + 实测尺寸 + 布局结构。

每个组件采集：外观、状态、密度、图标处理、动效手感、精确 padding、圆角与阴影公式、代表性 outerHTML。

## 第 5 遍：图标系统提取（实战精华，别跳过）

图标是 vibe coding 硬通货，单独提取：

### 判断图标体系

并存多套要分别处理：`<svg>` 内联 / `<use xlink:href="#xxx">` sprite / `<img src="远程.svg">` / iconfont symbol。

### SVG sprite 全量抠取

```js
document.querySelectorAll('symbol[id^="前缀-"]') + innerHTML
```

一次性拿全部 symbol 的 viewBox 和路径。**别逐个 getElementById**（会漏）。一个页面 sprite 容器可能注册几百个图标，远超当前用到的。

### 远程图标

`list_network_requests` / `browser_network_requests` 过滤 `.svg` 请求拿 URL 清单，再查看响应。菜单图标常是远程 `-mix.svg` 图片。

### 多色语义保留（关键）

抠取时**不要盲目 currentColor 化**：

- 状态图标（绿/红/橙）、套餐渐变、品牌色的硬编码 `fill` 是语义色，必须保留。
- 只给**无 fill 属性**的图形元素注入 `currentColor`（让单色菜单图标受 CSS color 控制）。
- 正则：`<(path|circle|rect|ellipse|polygon|polyline)(?![^>]*\bfill=)([^>]*)>` → 注入 `fill="currentColor"`。

### 渐变 defs

图标引用 `url(#paint...)` 渐变时，额外抠 `<defs>` 里的 linearGradient/radialGradient 定义注入，否则渐变图标渲染不出来。过滤出被 symbol 实际引用的 defs（别全量注入，体积大）。

### normal/hover 双态

菜单图标常有 `xxx` ↔ `xxx-hover` 后缀双态 symbol，配对记录。注意默认态可能不是品牌色（有的默认灰，hover 才蓝底白字）。

### 导出

每个 symbol 导出独立 SVG 文件 + 生成可搜索图标库 HTML。详见 [scripts/extract-icons.mjs](../scripts/extract-icons.mjs) 或 SKILL.md 第 5 遍。

## 第 6 遍：归纳页面范式（vibe coding 核心）

从采集页归纳布局范式，让 AI 能"套骨架"生成新页面：

- 列出观察到的典型布局：列表页 / 详情页 / Dashboard / 表单配置页 / 日志分析三栏页 / 全局骨架 等。
- 每个范式记：适用场景、关键尺寸（侧栏宽、顶栏高、内容区边距）、核心组件组合、迷你布局示意图（div 拼真实比例）。
- 附"如何选范式"决策表。
- 配套 HTML 骨架模板（若值得）。

没有两个站点范式完全一样，按实际观察归纳，别套模板。

## 第 7 遍：内容与品牌语气

- 标题长度、动词选择、CTA 语气、句子节奏。
- 文案密度（稀疏还是密集）。
- 品牌语气：高端 / 俏皮 / 技术 / 冷静 / 紧迫 / 编辑型。
- 信任信号、功能命名模式。

## 第 8 遍：高保真复刻验收

1. 在实现前保存固定桌面和移动视口的原站截图。
2. 用 `asset-manifest.json` 建立页面位置到真实图片、字体、logo 和图标的映射。
3. 明确当前交付是代表性设计系统样例，还是包含全部区块与重复项目的完整网页复刻。
4. 分开记录视口、外层容器、图片渲染区域和图片原始尺寸；不要把方形素材误当成卡片尺寸。
5. 运行 `site2style assets` 检查所有图片、`srcset` 与 CSS 背景，再运行 `site2style audit` 对照原站与复刻证据。
6. 用 `render-visual-comparison.mjs` 生成并排/叠加对照页。
7. 按“结构与数量 → 几何尺寸 → 真实素材与图标 → 字体 → 颜色与层次 → 响应式 → 状态动效”的顺序修正。
8. 首屏或任一承诺范围仍有明显错位、缺图、错图标、错字体、低对比度、重叠、空白卡片或移动端溢出时，不得宣称高保真完成。

长页面优先逐视口和逐区块比对，避免把两张超长截图整体缩小后凭感觉判断。

## 证据记录

明确区分**实测**与**推断**：

- 实测："`Primary CTA 用饱和祖母绿填充，背景极深。`"
- 推断："`产品倾向每节一个强强调色，而非多色聚集。`"

标志性细节采集实现级值：标题行高与字间距、按钮/卡片/图片/徽章圆角、多层 box-shadow 栈、边框 vs 阴影模拟边框、焦点环颜色与粗细、重复出现的间距值、根 CSS 变量与 token 名、代表性节点 outerHTML 与样式规则。

## 丰富度自检

写 DESIGN.md 前问自己：

- 能用设计哲学语言描述站点身份，而不只是 token 吗？
- 字体层级够具体到可复用（不是"大/中/小"）吗？
- 知道卡片和按钮实际怎么搭的吗？
- **图标系统完整吗**（sprite 数量、多色保留、双态配对、渐变 defs）？
- **页面范式归纳了吗**（至少 3 种 + 选型决策表）？
- **真实素材映射完整吗**（图片、背景、字体、logo、图标）？
- **原站和复刻页在相同视口做过叠加对比吗**？
- 能给另一个 agent 3 个具体 build prompt 复刻这套系统吗？

不够就回站点再采一遍再写。

## 常用 JS 片段（在任意浏览器页面 JS 执行工具里跑）

### 根 CSS 变量

```js
Object.fromEntries(
  [...getComputedStyle(document.documentElement)]
    .filter(n => n.startsWith('--'))
    .map(n => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()])
)
```

### 代表性组件 HTML

```js
[...document.querySelectorAll('header, h1, button, a, section, article, table, nav')]
  .slice(0, 20).map(el => el.outerHTML.slice(0, 1000))
```

### 去重字体族

```js
[...new Set([...document.querySelectorAll('body, body *')].slice(0, 250)
  .map(el => getComputedStyle(el).fontFamily).filter(Boolean))].sort()
```

### 去重可见色

```js
[...new Set([...document.querySelectorAll('body, body *')].slice(0, 250)
  .flatMap(el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.borderColor]; })
  .filter(v => v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent'))].sort()
```

### SVG sprite 全量抠取

```js
Object.fromEntries([...document.querySelectorAll('symbol[id^="前缀-"]')]
  .map(s => [s.id, { vb: s.getAttribute('viewBox'), inner: s.innerHTML }]))
```

### 图片与背景图

```js
JSON.stringify({
  images: [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src).filter(Boolean),
  backgrounds: [...document.querySelectorAll('body *')].map(el => getComputedStyle(el).backgroundImage).filter(b => b && b !== 'none')
}, null, 2)
```

### hover 态 diff（配合浏览器 hover 自动化）

先采集 normal 态 computed style，再触发 hover 后采集一次并比较。`extract-browser-evidence.mjs` 会对代表性交互元素自动执行这一步。
