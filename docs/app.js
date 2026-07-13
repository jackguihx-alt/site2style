const translations = {
  zh: {
    skip: "跳到主要内容",
    navStory: "故事",
    navPackage: "产物",
    navWorkflow: "流程",
    navAgents: "Agent",
    navCompare: "差异",
    heroEyebrow: "开源 · MIT · Agent 中立",
    heroTitle: "把一个网站，变成任何 Agent 都能复用的设计语言。",
    heroSummary: "采集真实浏览器证据，分离测量与判断，交付一个可跨项目、跨模型、跨 session 使用的 design-package。",
    viewGithub: "查看 GitHub",
    openExample: "打开真实示例",
    copy: "复制",
    heroCaption: "真实输出：可读的设计规则与可追溯的测量证据并排呈现。",
    proofViewports: "响应式条件",
    proofEntrypoints: "人类 / Agent / 机器入口",
    proofTests: "自动化测试",
    proofVulns: "已知依赖漏洞",
    storyTitle: "“像”不是最终标准。",
    storyLead: "真正难的不是抄出黑字、白底和蓝按钮，而是找出页面为什么成立。",
    storyBody: "第一次复刻看起来很接近，但图标缺失、图片裁切错误、移动端素材不对、页面也不完整。继续写提示词解决不了问题，因为 Agent 拿到的是印象，不是系统。",
    storyQuote: "HTML2Style 把“看起来像”改写成“有证据、能迁移、可验证”。",
    failureIcons: "图标不再遗漏",
    failureIconsBody: "采集 inline SVG、sprite 与渲染尺寸。",
    failureImages: "图片不再猜裁切",
    failureImagesBody: "区分容器、渲染和原始几何。",
    failureResponsive: "移动端不再靠缩小",
    failureResponsiveBody: "记录 picture、srcset 与高度条件。",
    failureComplete: "完整度不再凭感觉",
    failureCompleteBody: "审计结构、数量、页高与资源健康。",
    packageTitle: "一个文件夹，三种入口。",
    packageSummary: "不再让用户面对一堆不知道先开哪个的文件。每个 design-package 都从同一个清晰入口开始。",
    roleHuman: "人类",
    roleMachine: "机器",
    roleHumanTitle: "先看结果，再决定下一步。",
    roleHumanBody: "双击打开，浏览视觉板、复制跨 session 提示词，并找到适合设计评审、开发或自动化的入口。",
    viewFile: "查看文件",
    fileStyle: "可迁移的视觉规则与设计边界。",
    fileProfile: "工具可直接读取的确定性测量。",
    fileBoard: "给人类评审的视觉呈现。",
    fileHandoff: "新 session 的自包含上下文。",
    fileManifest: "稳定 ID、文件角色和证据缺口。",
    fileEvidence: "截图、DOM、资源与响应式来源。",
    workflowTitle: "从页面到可复用设计语言。",
    workflowSummary: "每一步都留下可检查的中间产物。Agent 可以解释结论来自哪里，而不是把猜测包装成规则。",
    stepObserve: "观察",
    stepObserveBody: "在宽度和高度条件下渲染真实页面。",
    stepMeasure: "测量",
    stepMeasureBody: "采集字体、颜色、间距、图片、图标与结构。",
    stepDistill: "提炼",
    stepDistillBody: "分开确定性证据与 Agent 设计判断。",
    stepTransfer: "迁移",
    stepTransferBody: "保留设计逻辑，替换品牌身份和受保护素材。",
    stepVerify: "验证",
    stepVerifyBody: "检查资源、响应式覆盖与完整复刻范围。",
    transferKeep: "保留 / RETAIN",
    transferKeepBody: "层级、节奏、密度、形状、图片策略、响应式逻辑。",
    transferReplace: "替换 / REPLACE",
    transferReplaceBody: "Logo、品牌文案、专有摄影、图标和独特 campaign 概念。",
    agentsTitle: "不绑定某一个 Agent。",
    agentsSummary: "运行时是 CLI 与 MCP。Skill、AGENTS.md、CLAUDE.md、Cursor 和 Copilot 文件只是发现层，不是依赖。",
    copyCommand: "复制命令",
    compareTitle: "不是网页转 Figma，也不只是提取 Token。",
    compareSummary: "HTML2Style 解决的是设计上下文交接：让另一个 Agent 在另一个 session 中，仍然知道什么被测量、什么可迁移、什么必须替换。",
    compareCategory: "类别",
    comparePrimary: "主要结果",
    compareStrength: "适合场景",
    compareFigma: "网页转 Figma",
    compareFigmaResult: "可编辑画布",
    compareFigmaUse: "视觉重设计与协作",
    compareTokens: "Token 提取器",
    compareTokensResult: "颜色、字体、间距与变量",
    compareTokensUse: "快速品牌或前端基础配置",
    compareH2SResult: "证据 + 规则 + 边界 + 交接包",
    compareH2SUse: "跨 Agent 迁移、完整复刻与验证",
    relatedNote: "相关项目与范围差异已透明记录在 README，包括 Website to Design、DesignDNA、Dembrandt 和 brandmd。",
    readRelated: "查看说明 ↗",
    ctaTitle: "不要再让 Agent 只看一张截图猜设计。",
    ctaBody: "给它证据、规则和边界。然后把整个设计语言带到下一个项目。",
    startGithub: "从 GitHub 开始",
    viewOutput: "查看完整输出",
    footerLine: "给每一个 Agent 的网站设计证据。",
    copied: "已复制",
  },
  en: {
    skip: "Skip to main content",
    navStory: "Story",
    navPackage: "Package",
    navWorkflow: "Workflow",
    navAgents: "Agents",
    navCompare: "Position",
    heroEyebrow: "Open source · MIT · Agent-neutral",
    heroTitle: "Turn one website into a design language any Agent can reuse.",
    heroSummary: "Capture rendered browser evidence, separate measurements from judgment, and deliver one design-package that survives projects, models, and sessions.",
    viewGithub: "View on GitHub",
    openExample: "Open real example",
    copy: "Copy",
    heroCaption: "Real output: readable design rules beside traceable measurement evidence.",
    proofViewports: "responsive conditions",
    proofEntrypoints: "human / Agent / machine entries",
    proofTests: "automated tests",
    proofVulns: "known dependency vulnerabilities",
    storyTitle: "Looking similar is not the finish line.",
    storyLead: "The hard part is not reproducing black text, white space, and blue buttons. It is discovering why the page works.",
    storyBody: "The first reconstruction looked close, but icons were missing, image crops were wrong, mobile artwork used the wrong source, and the page was incomplete. More prompting could not fix the real problem: the Agent had impressions, not the system.",
    storyQuote: "HTML2Style turns “looks similar” into “evidenced, transferable, and verifiable.”",
    failureIcons: "Icons stop disappearing",
    failureIconsBody: "Capture inline SVG, sprites, and rendered geometry.",
    failureImages: "Image crops stop being guesses",
    failureImagesBody: "Separate owner, rendered, and intrinsic geometry.",
    failureResponsive: "Mobile stops being scaled desktop",
    failureResponsiveBody: "Record picture, srcset, width, and height conditions.",
    failureComplete: "Completeness stops being a feeling",
    failureCompleteBody: "Audit structure, counts, document height, and asset health.",
    packageTitle: "One folder. Three entry points.",
    packageSummary: "Users should not face a pile of files with no clear starting point. Every design-package begins with a deliberate entry for each role.",
    roleHuman: "Human",
    roleMachine: "Machine",
    roleHumanTitle: "Review the result, then choose the next step.",
    roleHumanBody: "Open the visual board, copy the cross-session prompt, and find the right entry for design review, development, or automation.",
    viewFile: "View file",
    fileStyle: "Transferable visual rules and design boundaries.",
    fileProfile: "Deterministic measurements tools can consume.",
    fileBoard: "A visual review surface for people.",
    fileHandoff: "Self-contained context for a new session.",
    fileManifest: "Stable ID, file roles, and evidence gaps.",
    fileEvidence: "Screenshots, DOM, assets, and responsive sources.",
    workflowTitle: "From rendered page to reusable design language.",
    workflowSummary: "Every stage leaves an inspectable artifact. An Agent can explain where each conclusion came from instead of presenting guesses as rules.",
    stepObserve: "Observe",
    stepObserveBody: "Render the real page across width and height conditions.",
    stepMeasure: "Measure",
    stepMeasureBody: "Capture type, color, spacing, imagery, icons, and structure.",
    stepDistill: "Distill",
    stepDistillBody: "Keep deterministic evidence separate from Agent judgment.",
    stepTransfer: "Transfer",
    stepTransferBody: "Preserve design logic while replacing identity and protected material.",
    stepVerify: "Verify",
    stepVerifyBody: "Check assets, responsive coverage, and promised reconstruction scope.",
    transferKeep: "RETAIN",
    transferKeepBody: "Hierarchy, rhythm, density, shape, image strategy, and responsive logic.",
    transferReplace: "REPLACE",
    transferReplaceBody: "Logos, brand copy, proprietary photography, icons, and distinctive campaign concepts.",
    agentsTitle: "No single Agent required.",
    agentsSummary: "The runtime is CLI and MCP. Skill, AGENTS.md, CLAUDE.md, Cursor, and Copilot files are discovery layers, not dependencies.",
    copyCommand: "Copy command",
    compareTitle: "Not website-to-Figma. Not just token extraction.",
    compareSummary: "HTML2Style solves design-context handoff: another Agent in another session can still tell what was measured, what can transfer, and what must be replaced.",
    compareCategory: "Category",
    comparePrimary: "Primary result",
    compareStrength: "Best for",
    compareFigma: "Website-to-Figma",
    compareFigmaResult: "Editable canvas",
    compareFigmaUse: "Visual redesign and collaboration",
    compareTokens: "Token extractors",
    compareTokensResult: "Colors, type, spacing, and variables",
    compareTokensUse: "Fast brand or frontend foundations",
    compareH2SResult: "Evidence + rules + boundaries + handoff",
    compareH2SUse: "Cross-Agent transfer, reconstruction, and verification",
    relatedNote: "Adjacent projects and scope differences are documented transparently in the README, including Website to Design, DesignDNA, Dembrandt, and brandmd.",
    readRelated: "Read the notes ↗",
    ctaTitle: "Stop asking an Agent to guess design from one screenshot.",
    ctaBody: "Give it evidence, rules, and boundaries. Then carry the entire design language into the next project.",
    startGithub: "Start on GitHub",
    viewOutput: "View complete output",
    footerLine: "Website design evidence for every Agent.",
    copied: "Copied",
  },
};

const roleContent = {
  zh: {
    human: {
      label: "START-HERE.html",
      title: "先看结果，再决定下一步。",
      body: "双击打开，浏览视觉板、复制跨 session 提示词，并找到适合设计评审、开发或自动化的入口。",
      href: "../examples/product-editorial/design-package/START-HERE.html",
    },
    agent: {
      label: "AGENT-HANDOFF.md",
      title: "新 session 不需要旧聊天记录。",
      body: "Agent 从自包含交接文件读取目标、规则、迁移边界、证据缺口和下一步，不必重新采集原站。",
      href: "../examples/product-editorial/design-package/AGENT-HANDOFF.md",
    },
    machine: {
      label: "manifest.json",
      title: "自动化从稳定入口开始。",
      body: "机器读取 package ID、相对路径、文件角色、来源元数据和证据缺口，不需要解析自然语言目录。",
      href: "../examples/product-editorial/design-package/manifest.json",
    },
  },
  en: {
    human: {
      label: "START-HERE.html",
      title: "Review the result, then choose the next step.",
      body: "Open the visual board, copy the cross-session prompt, and find the right entry for design review, development, or automation.",
      href: "../examples/product-editorial/design-package/START-HERE.html",
    },
    agent: {
      label: "AGENT-HANDOFF.md",
      title: "A new session does not need the old chat.",
      body: "The Agent reads goals, rules, transfer boundaries, evidence gaps, and next actions from one self-contained handoff without re-extracting the source.",
      href: "../examples/product-editorial/design-package/AGENT-HANDOFF.md",
    },
    machine: {
      label: "manifest.json",
      title: "Automation starts from a stable entry.",
      body: "Machines read the package ID, relative paths, file roles, source metadata, and evidence gaps without parsing a prose directory.",
      href: "../examples/product-editorial/design-package/manifest.json",
    },
  },
};

let currentLanguage = localStorage.getItem("html2style-language") || (navigator.language.startsWith("zh") ? "zh" : "en");
let currentRole = "human";

function setLanguage(language) {
  currentLanguage = language;
  localStorage.setItem("html2style-language", language);
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.title = language === "zh"
    ? "HTML2Style | 给每一个 Agent 的网站设计证据"
    : "HTML2Style | Website design evidence for every Agent";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translations[language][element.dataset.i18n];
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });

  renderRole();
}

function renderRole() {
  const content = roleContent[currentLanguage][currentRole];
  document.querySelector("#role-label").textContent = content.label;
  document.querySelector("#role-title").textContent = content.title;
  document.querySelector("#role-body").textContent = content.body;
  document.querySelector("#role-link").href = content.href;
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1500);
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

document.querySelectorAll("[data-role]").forEach((button) => {
  button.addEventListener("click", () => {
    currentRole = button.dataset.role;
    document.querySelectorAll("[data-role]").forEach((candidate) => {
      candidate.setAttribute("aria-selected", String(candidate === button));
    });
    renderRole();
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast(translations[currentLanguage].copied);
    } catch {
      showToast(button.dataset.copy);
    }
  });
});

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  navigation.classList.toggle("is-open", !open);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  });
});

setLanguage(currentLanguage);
