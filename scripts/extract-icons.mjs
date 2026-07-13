#!/usr/bin/env node
/**
 * extract-icons.mjs — 图标系统提取脚本（实战精华）
 *
 * 用法（三种模式）：
 *
 * 1. 从浏览器页面执行环境导出的 JSON 提取：
 *    先在任意浏览器自动化环境中执行 sprite 抠取 JS（见下方 GET_SYMBOLS_JS），
 *    把返回结果存成 symbols.json，再：
 *    node extract-icons.mjs --from-json symbols.json --out ./icon-output
 *
 * 2. 从已有 HTML 文件提取（兼容旧流程）：
 *    node extract-icons.mjs --from-html design-system.html --out ./icon-output
 *
 * 3. 直接读取 extract-browser-evidence.mjs 的产物：
 *    node extract-icons.mjs --from-evidence evidence.json --out ./icon-output
 *
 * 产出：
 *   {out}/svg/{id}.svg          独立 SVG 文件（保留语义色，无 fill 注入 currentColor）
 *   {out}/icons-data.json       完整数据（symbol + defs + 分组 + 双态配对）
 *   {out}/图标库.html            可搜索的图标浏览页
 *
 * 关键设计（踩坑总结）：
 *   - 多色语义保留：有硬编码 fill 的保留，无 fill 的注入 currentColor。不盲目 currentColor 化。
 *   - 渐变 defs：图标引用 url(#paint...) 时需配套注入 <defs>，否则渐变图标不渲染。
 *   - 大小写冲突：macOS 文件系统大小写不敏感，名称仅大小写不同的图标文件会互相覆盖。
 *     检测并给大写变体加后缀。
 *   - normal/hover 双态：xxx ↔ xxx-hover 配对记录。
 */

import fs from 'node:fs';
import path from 'node:path';

// ========== 配置 ==========
const ARGS = parseArgs(process.argv.slice(2));
const PREFIX = ARGS.prefix ?? ''; // symbol id 前缀；不传则提取全部带 id 的 symbol
const OUT = ARGS.out || './icon-output';
const ACCENT = ARGS.accent || '#0052d9';

// sprite 抠取 JS（贴到 chrome-devtools evaluate_script 跑）
const GET_SYMBOLS_JS = `
(() => {
  const out = {};
  document.querySelectorAll('symbol[id]').forEach(s => {
    if (${JSON.stringify(PREFIX)} && !s.id.startsWith(${JSON.stringify(PREFIX)})) return;
    out[s.id] = { vb: s.getAttribute('viewBox') || '0 0 16 16', inner: s.innerHTML };
  });
  // defs（渐变/pattern）
  const defs = {};
  document.querySelectorAll('defs').forEach(d => {
    d.querySelectorAll('linearGradient, radialGradient').forEach(g => {
      defs[g.id] = g.outerHTML;
    });
  });
  return JSON.stringify({ symbols: out, defs });
})();
`;

// ========== 主流程 ==========
function main() {
  let raw;
  if (ARGS['from-json']) {
    raw = JSON.parse(fs.readFileSync(ARGS['from-json'], 'utf-8'));
    // 兼容 {symbols:{}} 或 {symbols:{},defs:{}}
    if (typeof raw === 'string') raw = JSON.parse(raw);
    if (typeof raw === 'string') raw = JSON.parse(raw);
  } else if (ARGS['from-evidence']) {
    const evidence = JSON.parse(fs.readFileSync(ARGS['from-evidence'], 'utf-8'));
    raw = extractFromEvidence(evidence);
  } else if (ARGS['from-html']) {
    const html = fs.readFileSync(ARGS['from-html'], 'utf-8');
    raw = extractFromHtml(html);
  } else {
    console.error('用法: node extract-icons.mjs --from-json symbols.json --out ./out [--prefix=前缀-] [--accent=#0052d9]');
    console.error('      node extract-icons.mjs --from-evidence evidence.json --out ./out [--prefix=前缀-] [--accent=#0052d9]');
    console.error('      node extract-icons.mjs --from-html design-system.html --out ./out [--prefix=前缀-] [--accent=#0052d9]');
    console.error('\n不传 --prefix 时提取全部带 id 的 symbol；站点 sprite 很大时建议指定实际前缀。\n');
    console.error('\n在任意浏览器页面 JS 执行工具中运行这段代码来提取 sprite：\n');
    console.error(GET_SYMBOLS_JS);
    process.exit(1);
  }

  const symbols = raw.symbols || raw;
  const defs = raw.defs || {};
  const ids = Object.keys(symbols);
  console.log(`找到 ${ids.length} 个 symbol`);

  // 过滤 defs：只保留被 symbol 引用的
  const usedDefs = filterDefs(defs, symbols);
  console.log(`defs: 共 ${Object.keys(defs).length} 个，被引用 ${Object.keys(usedDefs).length} 个`);

  // 双态配对
  const hoverPairs = pairHoverStates(ids);
  console.log(`normal/hover 双态配对：${Object.keys(hoverPairs).length} 对`);

  // 导出独立 SVG
  const outDir = path.resolve(OUT);
  const svgDir = path.join(outDir, 'svg');
  fs.mkdirSync(svgDir, { recursive: true });
  const conflicts = exportSvgs(symbols, svgDir);
  console.log(`导出 SVG 文件：${ids.length - conflicts.size} 个${conflicts.size ? `（${conflicts.size} 个大小写冲突已加后缀）` : ''}`);

  // 合并数据
  const data = {
    count: ids.length,
    symbols,
    defs: usedDefs,
    hoverIds: hoverPairs,
    groups: groupIcons(ids),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, 'icons-data.json'), JSON.stringify(data, null, 2));

  // 生成图标库 HTML
  const html = buildIconLibraryHtml(data, conflicts);
  fs.writeFileSync(path.join(outDir, '图标库.html'), html);
  console.log(`\n产出目录：${outDir}`);
  console.log(`  svg/        ${ids.length} 个 SVG 文件`);
  console.log(`  icons-data.json`);
  console.log(`  图标库.html`);
}

// ========== 从 HTML 提取 ==========
function extractFromHtml(html) {
  const re = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi;
  const symbols = {};
  let m;
  while ((m = re.exec(html))) {
    const id = readAttribute(m[1], 'id');
    if (!id || (PREFIX && !id.startsWith(PREFIX))) continue;
    symbols[id] = { vb: readAttribute(m[1], 'viewBox') || '0 0 16 16', inner: m[2] };
  }
  const defs = {};
  const defRe = /<(linearGradient|radialGradient|pattern|clipPath|mask|filter)\b([^>]*)>[\s\S]*?<\/\1>/gi;
  while ((m = defRe.exec(html))) {
    const id = readAttribute(m[2], 'id');
    if (id) defs[id] = m[0];
  }
  return { symbols, defs };
}

function extractFromEvidence(evidence) {
  const page = evidence.pages?.desktop || Object.values(evidence.pages || {})[0];
  const svg = page?.assets?.svg;
  if (!svg) throw new Error('Evidence JSON does not contain pages.*.assets.svg');

  const symbols = { ...(svg.symbols || {}) };
  for (const [index, item] of (svg.inline || []).entries()) {
    const match = `${item.html || ''}`.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!match) continue;
    const baseId = item.id || `inline-svg-${index + 1}`;
    let id = baseId;
    let suffix = 2;
    while (symbols[id]) id = `${baseId}-${suffix++}`;
    if (PREFIX && !id.startsWith(PREFIX)) continue;
    symbols[id] = {
      vb: readAttribute(match[1], 'viewBox') || inferViewBox(match[1]),
      inner: match[2],
    };
  }
  return { symbols, defs: svg.defs || {} };
}

function readAttribute(attributes, name) {
  const match = `${attributes || ''}`.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : null;
}

function inferViewBox(attributes) {
  const width = Number.parseFloat(readAttribute(attributes, 'width')) || 16;
  const height = Number.parseFloat(readAttribute(attributes, 'height')) || 16;
  return `0 0 ${width} ${height}`;
}

// ========== 渐变 defs 过滤 ==========
function filterDefs(defs, symbols) {
  // 收集 symbol inner 里引用的 url(#xxx)
  const referenced = new Set();
  for (const id in symbols) {
    const inner = symbols[id].inner;
    const re = /url\(#([^)]+)\)/g;
    let m;
    while ((m = re.exec(inner))) referenced.add(m[1]);
    // 也匹配 href="#xxx" / xlink:href="#xxx"
    const re2 = /(?:xlink:href|href)="#([^"]+)"/g;
    while ((m = re2.exec(inner))) {
      // 只算引用 defs 的，不算引用其他 symbol 的
      if (defs[m[1]]) referenced.add(m[1]);
    }
  }
  const out = {};
  for (const id of referenced) {
    if (defs[id]) out[id] = defs[id];
  }
  return out;
}

// ========== normal/hover 双态配对 ==========
function pairHoverStates(ids) {
  const pairs = {};
  for (const id of ids) {
    if (id.endsWith('-hover')) {
      const base = id.slice(0, -6);
      if (ids.includes(base)) pairs[base] = id;
    }
  }
  return pairs;
}

// ========== 导出独立 SVG ==========
function exportSvgs(symbols, dir) {
  const conflicts = new Map(); // lowerId -> [ids]
  // 先检测大小写冲突
  const lowerMap = {};
  for (const id in symbols) {
    const low = id.toLowerCase();
    (lowerMap[low] = lowerMap[low] || []).push(id);
  }
  for (const id in symbols) {
    let filename = id;
    const low = id.toLowerCase();
    const group = lowerMap[low];
    if (group.length > 1 && id !== low) {
      // 有大小写冲突，且当前 id 含大写，加后缀
      filename = id + '-upper';
      conflicts.set(id, filename);
    }
    const svg = rawSvg(symbols[id]);
    fs.writeFileSync(path.join(dir, filename + '.svg'), svg);
  }
  return conflicts;
}

function rawSvg(s) {
  // 保留硬编码 fill，无 fill 的注入 currentColor
  let inner = s.inner.replace(
    /<(path|circle|rect|ellipse|polygon|polyline)(?![^>]*\bfill=)([^>]*)>/gi,
    '<$1 fill="currentColor"$2>'
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.vb}" fill="none">${inner.trim()}</svg>`;
}

// ========== 生成图标库 HTML ==========
function buildIconLibraryHtml(data, conflicts) {
  const { symbols, defs, hoverIds, count } = data;
  const ids = Object.keys(symbols);

  // 简单分组（按 id 关键词）
  const groups = groupIcons(ids);

  let gridHtml = '';
  let total = 0;
  for (const g of Object.keys(groups)) {
    const gids = groups[g];
    if (!gids.length) continue;
    gridHtml += `<h3 class="grp">${g} <span class="cnt">${gids.length}</span></h3><div class="grid">`;
    for (const id of gids) {
      const svg = pageSvg(symbols[id], 26);
      const note = hoverIds[id] ? ' ↔ -hover' : '';
      gridHtml += `<div class="cell" data-id="${id}" data-l="${id}${note}">
        <div class="box">${svg}</div>
        <div class="iid">${id.replace(PREFIX, '')}</div>${note ? `<div class="pair">${note}</div>` : ''}
      </div>`;
      total++;
    }
    gridHtml += `</div>`;
  }
  // 未分组的兜底
  const grouped = new Set();
  for (const g in groups) groups[g].forEach(id => grouped.add(id));
  const leftover = ids.filter(id => !grouped.has(id));
  if (leftover.length) {
    gridHtml += `<h3 class="grp">其他 <span class="cnt">${leftover.length}</span></h3><div class="grid">`;
    for (const id of leftover) {
      gridHtml += `<div class="cell" data-id="${id}" data-l="${id}"><div class="box">${pageSvg(symbols[id], 26)}</div><div class="iid">${id.replace(PREFIX, '')}</div></div>`;
      total++;
    }
    gridHtml += `</div>`;
  }

  const defsStr = Object.values(defs).join('\n');

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>图标资产库</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:#f2f4f8;color:rgba(0,0,0,.9);font-size:14px}
.dh{position:absolute;width:0;height:0;overflow:hidden}
.hero{background:#fff;border-bottom:1px solid #e7eaef;padding:28px 32px}
.hero h1{font-size:20px;font-weight:600;margin-bottom:8px}
.hero p{font-size:13px;color:rgba(0,0,0,.55);line-height:1.7}
.hero .st{display:flex;gap:24px;margin-top:14px}
.hero .st b{font-size:20px;color:${ACCENT}}
.hero .st span{font-size:11px;color:rgba(0,0,0,.5);display:block}
.tb{position:sticky;top:0;background:#fff;border-bottom:1px solid #e7eaef;padding:10px 32px;z-index:10}
.q{height:30px;border:1px solid #e7eaef;border-radius:0;padding:0 10px;font-size:13px;outline:none;transition:border-color .2s;width:100%}
.q:focus{border-color:${ACCENT}}
.w{padding:20px 32px 60px}
.grp{font-size:14px;font-weight:600;margin:18px 0 12px;padding-left:8px;border-left:3px solid ${ACCENT}}
.cnt{font-size:11px;font-weight:400;color:rgba(0,0,0,.4);background:#fff;border:1px solid #e7eaef;padding:1px 6px;margin-left:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
.cell{background:#fff;border:1px solid #e7eaef;padding:14px 8px 8px;text-align:center;cursor:pointer;transition:border-color .15s}
.cell:hover{border-color:${ACCENT}}
.box{height:30px;display:flex;align-items:center;justify-content:center;color:${ACCENT};margin-bottom:6px}
.iid{font-size:10px;font-family:Menlo,Consolas,monospace;color:rgba(0,0,0,.85);word-break:break-all}
.pair{font-size:9px;color:${ACCENT};margin-top:2px}
.tip{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:${ACCENT};color:#fff;padding:8px 16px;font-size:12px;opacity:0;transition:opacity .2s;pointer-events:none}
.tip.show{opacity:1}
</style></head><body>
<svg class="dh"><defs>${defsStr}</defs></svg>
<div class="hero"><h1>图标资产库</h1>
<p>从站点真实 SVG sprite 抠取，保留语义色。点击复制图标名。独立 SVG 文件见 svg/ 目录。</p>
<div class="st"><div><b>${count}</b><span>图标</span></div><div><b>${Object.keys(hoverIds).length}</b><span>双态</span></div><div><b>${Object.keys(defs).length}</b><span>渐变 defs</span></div></div>
</div>
<div class="tb"><input class="q" id="q" placeholder="搜索图标名…"></div>
<div class="w">${gridHtml}</div>
<div class="tip" id="tip">已复制</div>
<script>
const q=document.getElementById('q'),cells=[...document.querySelectorAll('.cell')],tip=document.getElementById('tip');
q.oninput=()=>{const v=q.value.trim().toLowerCase();cells.forEach(c=>c.style.display=(c.dataset.l.toLowerCase().includes(v)?'':'none'));};
cells.forEach(c=>c.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(c.dataset.id);tip.classList.add('show');setTimeout(()=>tip.classList.remove('show'),600);});
</script></body></html>`;
}

function pageSvg(s, size = 24) {
  let inner = s.inner.replace(
    /<(path|circle|rect|ellipse|polygon|polyline)(?![^>]*\bfill=)([^>]*)>/gi,
    '<$1 fill="currentColor"$2>'
  );
  return `<svg viewBox="${s.vb}" width="${size}" height="${size}">${inner}</svg>`;
}

// ========== 简单分组 ==========
function groupIcons(ids) {
  const groups = {
    '菜单/导航': [],
    '操作类': [],
    '方向/折叠': [],
    '状态/语义': [],
    '业务/计费': [],
  };
  for (const id of ids) {
    const n = id.replace(PREFIX, '');
    if (/overview|version|dns|origin|zone|nav|menu|home|dashboard|back|layer4|proxy|certificate|exclusive|cpage/.test(n)) groups['菜单/导航'].push(id);
    else if (/plus|delete|edit|copy|save|close|return|download|search|setting|drag|condition|switch|tag|code|collapse|bold/.test(n)) groups['操作类'].push(id);
    else if (/go-top|go-bottom|go-up|go-down|go-left|go-right|circle-right|line-gengduo|return|collapse|arrow|chevron|caret/.test(n)) groups['方向/折叠'].push(id);
    else if (/success|fail|warning|info|error|danger|availability|improve|status/.test(n)) groups['状态/语义'].push(id);
    else if (/cdn|lb|l4|plan|usage|file|secure|target|global|log|realtime|media|video|image|alarm|json/.test(n)) groups['业务/计费'].push(id);
  }
  return groups;
}

// ========== args ==========
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const raw = argv[i].slice(2);
      const eq = raw.indexOf('=');
      if (eq !== -1) {
        a[raw.slice(0, eq)] = raw.slice(eq + 1);
        continue;
      }
      a[raw] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      if (a[raw] !== true) i++;
    }
  }
  return a;
}

main();
