#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const [originalArg, replicaArg, outputArg] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

if (!originalArg || !replicaArg || !outputArg) {
  console.error("Usage: node scripts/render-visual-comparison.mjs <original.png> <replica.png> <comparison.html>");
  process.exit(1);
}

const originalPath = path.resolve(process.cwd(), originalArg);
const replicaPath = path.resolve(process.cwd(), replicaArg);
const outputPath = path.resolve(process.cwd(), outputArg);

const [original, replica] = await Promise.all([
  imageDataUrl(originalPath),
  imageDataUrl(replicaPath),
]);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, renderHtml(original, replica), "utf8");
console.log(outputPath);

async function imageDataUrl(filePath) {
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function renderHtml(originalUrl, replicaUrl) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>视觉还原对比</title>
  <style>
    :root { color-scheme: dark; --bg: #0d0e10; --panel: #17191d; --line: #31343a; --text: #f4f5f7; --muted: #a7abb3; --accent: #6b7cff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; background: var(--bg); color: var(--text); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; gap: 16px; min-height: 58px; padding: 10px 18px; border-bottom: 1px solid var(--line); background: rgba(13,14,16,.94); backdrop-filter: blur(12px); }
    h1 { margin: 0 auto 0 0; font-size: 15px; font-weight: 650; }
    .modes { display: inline-flex; border: 1px solid var(--line); }
    button { min-height: 34px; padding: 0 12px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; }
    button:last-child { border-right: 0; }
    button.active { background: var(--accent); color: white; }
    label { display: flex; align-items: center; gap: 8px; color: var(--muted); }
    input { width: 150px; accent-color: var(--accent); }
    main { padding: 18px; }
    .side { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    figure { margin: 0; min-width: 0; border: 1px solid var(--line); background: var(--panel); }
    figcaption { padding: 9px 12px; border-bottom: 1px solid var(--line); color: var(--muted); }
    img { display: block; width: 100%; height: auto; }
    .overlay { position: relative; display: none; width: min(1440px, 100%); margin: 0 auto; overflow: hidden; border: 1px solid var(--line); background: var(--panel); }
    .overlay img { width: 100%; }
    .overlay .replica { position: absolute; inset: 0; width: var(--reveal, 50%); overflow: hidden; border-right: 2px solid var(--accent); }
    .overlay .replica img { width: calc(100vw - 36px); max-width: 1440px; }
    .overlay-label { position: absolute; top: 10px; padding: 5px 8px; background: rgba(0,0,0,.78); color: white; font-size: 12px; }
    .label-original { right: 10px; }
    .label-replica { left: 10px; }
    body.overlay-mode .side { display: none; }
    body.overlay-mode .overlay { display: block; }
    body:not(.overlay-mode) .slider { display: none; }
    @media (max-width: 760px) { .side { grid-template-columns: 1fr; } header { align-items: flex-start; } }
  </style>
</head>
<body>
  <header>
    <h1>原站 / 复刻页视觉对比</h1>
    <div class="modes" aria-label="对比模式">
      <button id="sideButton" class="active" type="button">并排</button>
      <button id="overlayButton" type="button">叠加</button>
    </div>
    <label class="slider">复刻页显示范围 <input id="reveal" type="range" min="0" max="100" value="50"></label>
  </header>
  <main>
    <section class="side">
      <figure><figcaption>原站</figcaption><img src="${originalUrl}" alt="原站截图"></figure>
      <figure><figcaption>复刻页</figcaption><img src="${replicaUrl}" alt="复刻页截图"></figure>
    </section>
    <section class="overlay" id="overlay">
      <img src="${originalUrl}" alt="原站截图">
      <div class="replica"><img src="${replicaUrl}" alt="复刻页截图"><span class="overlay-label label-replica">复刻页</span></div>
      <span class="overlay-label label-original">原站</span>
    </section>
  </main>
  <script>
    const body = document.body;
    const sideButton = document.getElementById('sideButton');
    const overlayButton = document.getElementById('overlayButton');
    const overlay = document.getElementById('overlay');
    const reveal = document.getElementById('reveal');
    sideButton.onclick = () => { body.classList.remove('overlay-mode'); sideButton.classList.add('active'); overlayButton.classList.remove('active'); };
    overlayButton.onclick = () => { body.classList.add('overlay-mode'); overlayButton.classList.add('active'); sideButton.classList.remove('active'); };
    reveal.oninput = () => overlay.style.setProperty('--reveal', reveal.value + '%');
  </script>
</body>
</html>`;
}
