# Agent 交接：Product Editorial Example

Package ID：`design-language-0dd741359bac`
Package type：`website-design-language`
参考来源：`https://example.com/fictional-product`

## Session 约定

这个文件是新 AI session 唯一需要的入口。设计包已经完成采集和测量。除非用户要求刷新，或证据缺口阻碍当前任务，否则不要浏览或重新采集参考网站。

## 阅读顺序

1. 完整阅读 `STYLE.md`，它是可迁移设计语言的事实来源。
2. 只有在需要核对精确测量、响应式数值或置信度时，才读取 `style-profile.json`。
3. 可以进行视觉评审时，打开 `style-board.html`。
4. 只有需要实现细节时才读取 `advanced/`；只有审计结论时才读取 `evidence/`。

## 应用到新任务

开始实现前，先明确：

- 新产品的目标受众。
- 主要用户任务或转化目标。
- 必需内容与信息架构。
- 用户拥有或获准使用的素材。
- 目标平台与响应式条件。

然后：

1. 保留 `STYLE.md` 中测量得到的层级、节奏、密度、对比、形状、图片方向、动效克制和响应式变化。
2. 遵守所有 `retain / reinterpret / replace` 边界。
3. 根据新任务创建原创结构，默认不要照搬参考网站的页面顺序。
4. 除非用户提供了相应权利，否则替换原站品牌、名称、文案、图标、摄影、字体和 campaign 概念。
5. 验证桌面端与移动端层级、图片构图、文字适配、对比度、焦点状态、资源健康和对 `STYLE.md` 的遵守情况。

## 回复要求

说明使用了哪个 package ID、保留了什么、重新解释了什么、替换了什么，以及哪些证据限制影响了结果。
