# Design System: [Site Name]

> 来源说明：基于 [URL] 实测提取，token 来自浏览器 CSS 变量与 computed style，非截图猜测。

## 0. Source, Viewports & Fidelity Evidence

| Item | Value |
| --- | --- |
| Source URL(s) | [URL] |
| Capture date | [ISO date] |
| Desktop viewport | [width × height] |
| Mobile viewport | [width × height] |
| Evidence file | [relative path] |
| Asset manifest | [relative path] |
| Original screenshots | [relative paths] |
| Known limitations | [login/blocked/dynamic/personalized areas] |

明确区分“实测”“推断”“未观测”。后续复刻截图必须使用相同视口。

## 1. Visual Theme & Atmosphere

整体气质、密度、构图风格、美学理念。

- 整体感受:
- 视觉密度:
- 品牌姿态:
- 标志性母题:

### Key Characteristics

- [特征]
- [特征]
- [特征]

## 2. Color Palette & Roles

用语义名，含精确 hex。

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Primary action | [名] | [#HEX] | [用法] |
| Accent | [名] | [#HEX] | [用法] |
| Surface | [名] | [#HEX] | [用法] |
| Text | [名] | [#HEX] | [用法] |
| Border | [名] | [#HEX] | [用法] |

### Primary

- [色彩与角色]
- **多色系并存**（若有）：若站点有多个相近的强调色（如品牌色 / 业务强调色 / 链接色），分别记录颜色 + 用途 + 出现位置。别合并成一个"蓝色系"——复刻时用错会直接导致页面气质偏差。
  - 品牌色：[#xxx] — 用于 [框架组件 / 主按钮 / 链接]
  - 业务蓝：[#xxx] — 用于 [自研组件 / 开关开启 / 按钮组选中]
  - 功能蓝：[#xxx] — 用于 [业务页面 / 特定场景]

### Interactive

- [链接、焦点环、hover 色]

### Neutral Scale

- [灰阶层级]

### Surface & Overlay

- [表面 token]
- [遮罩 token]

### Theme Modes

若支持浅深模式，分别记录。

#### Light Mode

- Background / Surface / Text / Accent / Notes:

#### Dark Mode

- Background / Surface / Text / Accent / Notes:

### Shadows & Depth

- [边框/环处理]
- [卡片阴影栈]
- [焦点处理]

## 3. Typography Rules

### Font Family

- Primary:
- Monospace:
- OpenType Features:

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Hero | [字] | [字号] | [字重] | [行高] | [字距] | [说明] |
| Section heading | [字] | [字号] | [字重] | [行高] | [字距] | [说明] |
| Body | [字] | [字号] | [字重] | [行高] | [字距] | [说明] |
| Label | [字] | [字号] | [字重] | [行高] | [字距] | [说明] |
| Caption | [字] | [字号] | [字重] | [行高] | [字距] | [说明] |

### Principles

- [字体原则]

## 4. Component Stylings

### Buttons and Links

- Primary CTA:
- Secondary CTA:
- Text links:
- Hover/active 手感:

### Cards and Containers

- 表面风格 / 圆角 / 边框 / 阴影 / 内间距:

### Inputs and Interactive Controls

- 输入处理 / 焦点行为 / 选中态:

### Navigation

- 结构 / 背景处理 / 链接风格 / sticky 行为:

### Image Treatment

- 截图 / 插画 / 边框圆角:

### Distinctive Components

- [标志性模块]

## 4.5 Icon System（图标系统）

图标是 vibe coding 硬通货，单独记录。

### 图标体系

记录并存的多套体系：

| 体系 | 引用方式 | 渲染方式 | 用途 | 颜色 |
| --- | --- | --- | --- | --- |
| [业务图标] | `<use #前缀-*>` sprite | SVG symbol 复用 | [用途] | [色] |
| [框架图标] | 内联 SVG | currentColor | [用途] | [色] |
| [远程图标] | `<img src>` | 远程图片 | [用途] | [色] |

### 尺寸规格

落在网格上的尺寸：[12 / 14 / 16 / 20 / 24 / 32 px]。主力尺寸 [16px]。

### 颜色规则

- 业务图标默认色 [brand #xxx]，选中/hover 切换到 [-hover 后缀 symbol / 蓝底白字]。
- 框架图标继承 currentColor，跟随父元素文字色。
- 语义色图标（成功/失败/警告）自带语义色，保留硬编码 fill。
- 多色图标（套餐渐变/状态色）的硬编码 fill 是语义色，**不要 currentColor 化**。
- 渐变图标引用 `url(#paint...)`，需配套注入 `<defs>` 渐变定义。

### normal/hover 双态

配对记录 [N 对]：normal 态 [灰 #xxx] → hover/选中态 [蓝底白字 #fff]。

### 图标清单

- 导航/菜单类（带 -hover 双态）：[列表]
- 操作类：[列表]
- 方向类：[列表]
- 状态/语义类：[列表]
- 业务/计费类：[列表]

> 复刻建议：业务图标统一 [16px] + 品牌色，菜单图标做 normal/hover 双态；通用图标用 currentColor 跟随文字色。无图标时优先用线性 outline 风格，避免实心彩色图标。

## 4.6 Business Composite Components（业务复合组件）

控制台自研复合布局，比基础组件更有参考价值。

| 组件 | class | 关键样式（实测） | 说明 |
| --- | --- | --- | --- |
| [复合组件名] | [.class] | [尺寸/颜色/布局] | [用途] |

记录每个复合组件的：容器结构、关键尺寸、状态变化、与基础组件的差异。

> 关键 token 差异（若有）：业务组件可能使用区别于框架默认值的强调色、边框或密度。分别记录，不要合并成一套规则。

## 4.7 Asset Inventory（素材映射）

| 页面位置 | 类型 | 原始资源 | 显示尺寸/裁切 | 复刻要求 |
| --- | --- | --- | --- | --- |
| [Hero] | [image/logo/icon/font] | [URL 或相对路径] | [尺寸/object-fit] | [必须复用/可替代/被阻止] |

- 图片：记录 `src/currentSrc/srcset`、原始尺寸、显示尺寸、`object-fit` 和响应式切换。
- 字体：记录 family、weight、style、字体文件 URL 与加载失败时的 fallback。
- 图标：链接到导出的图标库和具体 symbol/文件名。
- 背景：记录 URL、`background-size`、position 和所在区块。
- 原资源可提取时不要用 CSS 形状、emoji、文字或近似图标代替。

## 5. Layout Principles

### Spacing System

| Token | Value | 用途 |
| --- | --- | --- |
| [token] | [值] | [用途] |

### Grid & Container

- 网格逻辑 / 最大宽度 / 区块间距:

### Whitespace Philosophy

- 留白哲学 / 对齐倾向 / 内容宽度:

### Border Radius Scale

> **圆角逐组件实测，别一刀切**。实战中某控制台全局 0px 但 switch 10px、badge 12px——一刀切导致所有圆角全错。

| Name | Value | 用途 |
| --- | --- | --- |
| none | 0px | 按钮/输入框/卡片/表格（默认直角） |
| switch | 10px | 开关 toggle（可能不同于全局 radius） |
| badge | 12px | 状态徽章（可能不同于全局 radius） |
| pill | 9999px | 标签/胶囊 |

## 6. Page Patterns（页面范式）

归纳观察到的典型布局，让 AI 能套骨架生成新页面。

### 范式清单

| 范式 | 适用场景 | 关键尺寸 | 核心组件 |
| --- | --- | --- | --- |
| P0 全局骨架 | [场景] | [侧栏宽/顶栏高] | [组件] |
| P1 列表页 | [场景] | [尺寸] | [组件] |
| P2 站点详情 | [场景] | [尺寸] | [组件] |
| P3 Dashboard | [场景] | [尺寸] | [组件] |
| P4 表单配置 | [场景] | [尺寸] | [组件] |
| P5 日志分析 | [场景] | [尺寸] | [组件] |

### 如何选范式

[决策表/流程：根据页面意图选对应范式]

### 迷你布局示意图

[用 div 拼真实比例的迷你示意图，标注关键尺寸]

## 7. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | [处理] | [用途] |
| Hover | [处理] | [用途] |
| Selected | [处理] | [用途] |
| Focus | [处理] | [用途] |
| Popover | [处理] | [用途] |

### Z-Index 层级体系

> **必采集**。实战中第一次提取漏了 z-index，导致复刻时下拉被卡片挡住、遮罩层级错乱。

| 层级值（约） | 角色 | 典型元素 |
| --- | --- | --- |
| 1–5 | 页面内局部堆叠 | 卡片角标、相邻定位元素 |
| 10 | 吸顶头部 | 内容区固定头 / sticky header |
| 100 | 局部浮层/菜单 | 侧栏菜单浮层、拖拽层 |
| 1000 | 下拉/popover | 搜索面板、悬浮工具条、Select 下拉 |
| 1100 | 模态遮罩 | 弹窗/抽屉遮罩层 |
| 9999+ | 最高强制层 | 引导提示、需绝对置顶元素 |

> 用浏览器 MCP 的 JS 执行能力采集（playwright: `browser_evaluate`，chrome-devtools: `evaluate_script`）：`document.querySelectorAll('*').forEach(el => { const z = getComputedStyle(el).zIndex; if (z !== 'auto') console.log(z, el.className); })`。按实际采集值填，不要套模板。

## 8. Motion & Interaction（动效与交互）

| 场景 | transition | 说明 |
| --- | --- | --- |
| [场景] | [transition] | [说明] |

- 时长：交互态 [0.1-0.2s]，位移/弹层 [0.3-0.5s]。
- 缓动：标准 [cubic-bezier]，大位移 [cubic-bezier]。
- 原则：[克制/不用弹跳/不超 0.5s]。

### 状态态

| 状态 | 样式 |
| --- | --- |
| 禁用 | [处理] |
| 链接默认 | [色] |
| 滚动条 | [宽/样式] |
| 空状态 | [插画/文案/按钮] |

## 9. Do's and Don'ts

### Do

- [规则]
- [规则]

### Don't

- [反例]
- [反例]

## 10. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
| --- | --- | --- |
| [名] | [宽] | [变化] |

### Touch Targets

- [规则]

### Collapsing Strategy

- 桌面/平板/移动行为:

## 11. Agent Prompt Guide

### Fidelity Anchors

- 内容与区块顺序：[实测]
- 首屏关键坐标和尺寸：[header / hero / CTA / primary visual]
- 必须复用的素材：[logo / hero image / screenshots / icons / fonts]
- 桌面到移动端的结构变化：[实测]
- 对照截图与 comparison.html：[路径]
- 尚存差异：[没有则写 none；不要隐藏]

### Quick Color Reference

- 主操作/链接/选中: [#xxx]
- 正文/辅助文本: [#xxx]
- 边框/侧栏底: [#xxx]
- 错误/告警/成功: [#xxx]

### Quick Summary

4-8 行总结，让另一个 agent 快速复用。

### Global CSS Variables（可直接抄）

把所有 token 写成 `:root` 变量块，复刻时直接粘进 `<style>` 用，不用手动把表转变量。

```css
:root {
  /* Brand: fill from measured site values */
  --brand: [measured primary/action color];
  --brand-hover: [measured hover color];
  --brand-active: [measured active color];
  --brand-soft: [measured selected/soft background];
  --brand-lighten: var(--brand-soft);
  --focus-ring: [measured focus ring color];

  /* Functional */
  --error: [measured error color];
  --error-bg: [measured error background];
  --warning: [measured warning color];
  --warning-bg: [measured warning background];
  --success: [measured success color];
  --success-bg: [measured success background];
  --info: [measured info color];
  --info-bg: [measured info background];

  /* Text */
  --text-primary: [measured primary text];
  --text-secondary: [measured secondary text];
  --text-tertiary: [measured tertiary text];
  --text-disabled: [measured disabled text];
  --text-on-brand: [measured text on brand color];

  /* Surface */
  --bg-page: [measured page background];
  --bg-surface: [measured card/panel background];
  --bg-aside: [measured side/nav/table-head background];
  --bg-muted: [measured muted background];
  --bg-hover: [measured hover background];
  --bg-selected: [measured selected background];
  --overlay: [measured overlay color];

  /* Border */
  --border: [measured default border];
  --border-select: [measured select/input border];
  --border-strong: [measured strong/control border];
  --divider: [measured divider color];

  /* Radius: record component-level differences */
  --radius: [measured common radius or 0px];
  --radius-control: [measured buttons/inputs radius];
  --radius-card: [measured card radius];
  --radius-badge: [measured badge/tag radius];
  --radius-switch: [measured switch radius];
  --radius-popover: [measured popover radius];
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: [measured sans font stack];
  --font-mono: [measured mono font stack, if any];

  /* Shadow */
  --shadow-card: [measured card shadow or none];
  --shadow-popover: [measured popover/dropdown shadow];
  --shadow-modal: [measured modal/drawer shadow];

  /* Size */
  --control-h: [measured default control height];
  --content-max: [measured max content width, if any];
}
```

> **闭环警告**：变量块写完必须 grep 所有组件片段里的 `var(--xxx)` 引用，逐一确认已定义。缺失变量通常不会报错，只会静默 fallback 成错误颜色或尺寸。

> 把实测值填进去，别留占位符。

### Component Snippets（组件片段库，可直接抄改）

每个片段用上面定义的 CSS 变量，复刻者粘进去就能看到正确效果。

#### 主按钮 Primary

```html
<button class="btn-primary">主操作</button>
<style>
.btn-primary {
  background: var(--brand);
  color: var(--text-on-brand);
  border: none;
  border-radius: var(--radius);
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover { background: var(--brand-active); }
</style>
```

#### 次按钮 Secondary

```html
<button class="btn-secondary">次操作</button>
<style>
.btn-secondary {
  background: var(--bg-surface);
  color: var(--brand);
  border: 1px solid var(--brand);
  border-radius: var(--radius);
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  cursor: pointer;
}
.btn-secondary:hover { background: var(--brand-lighten); }
</style>
```

#### 文字按钮 Link

```html
<a class="btn-link">编辑</a>
<style>
.btn-link {
  color: var(--brand);
  text-decoration: none;
  cursor: pointer;
  font-size: 13px;
}
.btn-link:hover { color: var(--brand-active); }
</style>
```

#### 输入框 Input

```html
<input class="input" placeholder="请输入">
<style>
.input {
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 10px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: var(--brand); }
</style>
```

#### 卡片容器 Card

```html
<div class="card">
  <div class="card-header">标题</div>
  <div class="card-body">内容</div>
</div>
<style>
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card, none); /* 按实测填！可能有轻阴影 rgba(0,0,0,0.2) 0px 1px 3px 0px */
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  font-weight: 600;
}
.card-body { padding: 20px; }
</style>
```

#### 数据表格 Table

```html
<table class="data-table">
  <thead><tr><th>列名</th><th>操作</th></tr></thead>
  <tbody>
    <tr><td>内容</td><td><a class="btn-link">编辑</a></td></tr>
  </tbody>
</table>
<style>
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; padding: 10px 16px;
  background: var(--bg-aside);
  font-size: 13px; font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}
.data-table td {
  padding: 12px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--divider);
}
.data-table tr:hover td { background: var(--bg-hover); }
</style>
```

#### 分页器 Pagination

```html
<div class="pager">
  <span class="pg-total">共 N 条</span>
  <button class="pg-btn">‹</button>
  <span class="pg-cur">1</span>
  <button class="pg-btn">›</button>
</div>
<style>
.pager { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
.pg-total { margin-right: auto; }
.pg-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  cursor: pointer;
  color: var(--text-secondary);
}
.pg-btn:hover { border-color: var(--brand); color: var(--brand); }
.pg-cur { color: var(--brand); font-weight: 500; }
</style>
```

#### 状态标签 Badge

```html
<span class="badge badge-success">生效中</span>
<span class="badge badge-error">失败</span>
<style>
.badge {
  font-size: 12px; padding: 1px 8px;
  border-radius: var(--radius-badge, var(--radius)); /* badge 可能有独立圆角（如 12px），用 var(--radius-badge) 覆写 */
  line-height: 18px;
}
.badge-success { background: var(--success-bg); color: var(--success); }
.badge-error { background: var(--error-bg); color: var(--error); }
.badge-warning { background: var(--warning-bg); color: var(--warning); }
</style>
```

> 注意：状态徽章、开关、标签页等可能有独立圆角（不同于全局 --radius）。按实测在 CSS 变量块里定义 `--radius-badge`、`--radius-switch` 等组件级圆角变量以覆盖全局默认。

#### 下拉选择器 Select

```html
<div class="select-trigger">
  <span class="select-value">选项一</span>
  <span class="select-arrow">▾</span>
</div>
<style>
.select-trigger {
  display: flex; align-items: center; justify-content: space-between;
  height: 30px;
  border: 1px solid var(--border-select); /* 若下拉边框与 input 不同，单独记录 */
  border-radius: var(--radius);
  padding: 0 22px 0 10px; /* 右侧 22px 留给箭头 */
  background: var(--bg-surface);
  font-size: 12px;
  cursor: pointer;
}
.select-trigger:hover { border-color: var(--brand); }
.select-arrow { color: var(--text-secondary); }
</style>
```

#### 开关 Switch

```html
<label class="switch">
  <input type="checkbox" checked>
  <span class="switch-toggle"></span>
</label>
<style>
.switch { display: inline-block; width: 35px; height: 20px; }
.switch input { display: none; }
.switch-toggle {
  display: block; width: 35px; height: 20px;
  border-radius: var(--radius-switch); /* 开关常有独立圆角，按实测填 */
  background: var(--brand); /* 开启色按实测填，可能不同于主按钮色 */
  transition: background 0.2s;
  position: relative;
}
.switch-toggle::after {
  content: ''; position: absolute; top: 2px; left: 17px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--bg-surface); transition: left 0.2s;
}
.switch input:not(:checked) + .switch-toggle {
  background: var(--border-strong); /* 关闭灰色 */
}
.switch input:not(:checked) + .switch-toggle::after { left: 2px; }
</style>
```

#### 复选框 Checkbox

```html
<input type="checkbox" class="checkbox">
<style>
.checkbox {
  width: 16px; height: 16px;
  border: 1px solid var(--border-select);
  border-radius: var(--radius);
  background: var(--bg-surface);
  cursor: pointer;
  appearance: none;
}
.checkbox:checked {
  background: var(--brand);
  border-color: var(--brand);
}
</style>
```

#### 按钮组选择器 ButtonGroup（代替 Radio/Segment）

很多控制台用按钮组做单选，不用原生 radio：

```html
<div class="btn-group-selector">
  <button class="selected">选项一</button>
  <button>选项二</button>
</div>
<style>
.btn-group-selector { display: inline-flex; }
.btn-group-selector button {
  height: 30px; padding: 0 20px;
  font-size: 12px; border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: var(--bg-surface); color: var(--brand);
  cursor: pointer; border-right: none;
}
.btn-group-selector button:last-child { border-right: 1px solid var(--border-strong); }
.btn-group-selector button.selected {
  background: var(--brand); color: var(--text-on-brand); border-color: var(--brand);
}
</style>
```

#### Alert 信息提示条

```html
<div class="alert">
  <div class="alert-text">这是一条信息提示</div>
</div>
<style>
.alert {
  background: var(--info-bg);
  color: var(--info);
  border: 1px solid var(--info-bg);
  border-radius: var(--radius);
  padding: 14px 20px;
  font-size: 12px;
}
</style>
```

#### Drawer 抽屉

```html
<div class="drawer">
  <div class="drawer-header">标题</div>
  <div class="drawer-body">内容</div>
</div>
<style>
.drawer {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 1000px; /* 按实测 */
  background: var(--bg-surface);
  box-shadow: rgba(54,58,80,0.32) 0px 2px 4px 0px;
  z-index: 1100;
}
.drawer-header { height: 71px; padding: 10px 20px; font-size: 16px; font-weight: 600; }
.drawer-body { padding: 20px; overflow-y: auto; }
</style>
```

> 以上片段必须用当前目标站点的实测值改写；不要保留模板占位值或其他站点的示例值。

> 补充：业务复合组件按 4.6 章实测结构搭，每个也给一个片段。套餐、版本、状态等标签使用站点真实语义色，别默认套用品牌色。

### Example Component Prompts

- Hero: [prompt]
- Card: [prompt]
- Navigation: [prompt]
- Button: [prompt]

### Ready-to-Use Prompt

一段可直接粘进 build 任务的 prompt。

### Iteration Guide

1. [规则]
2. [规则]
3. [规则]

## Optional Appendix: Interaction Patterns

- 滚动/hover/click 行为:
- 动画基调:

## Optional Appendix: Content & Messaging Patterns

- 标题模式 / CTA 语言 / 信任信号 / 语气:

## Optional Appendix: Observed Pages

- [URL 或页名]: [贡献了什么]

## Optional Appendix: Evidence Notes

- 颜色/字体/间距 token 来源（CSS 变量数量、实测页面数）。
- 组件尺寸来源（getComputedStyle 实测）。
- 布局来源（getBoundingClientRect 实测）。
- 未观测到的：[暗色模式/自定义字体/渐变 等]。
