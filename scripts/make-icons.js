// アイコンと起動画面の元画像（assets/）を作る。
// 作ったあと `npx @capacitor/assets generate --android` で Android 用の各サイズを生成する。
// 使い方: node scripts/make-icons.js   （Playwright が必要）
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const out = path.join(__dirname, '..', 'assets');
fs.mkdirSync(out, { recursive: true });

// ねぎまの串（1024×1024 の座標）。斜めに置く
function skewer() {
  const piece = (cx, cy, kind) => {
    if (kind === 'negi') {
      return `<g transform="translate(${cx} ${cy})">
        <rect x="-78" y="-46" width="156" height="92" rx="40" fill="url(#negi)"/>
        <rect x="-60" y="-34" width="70" height="20" rx="10" fill="rgba(255,255,255,0.45)"/>
        <path d="M-50 30 L50 -30" stroke="rgba(60,80,20,0.35)" stroke-width="8" stroke-linecap="round"/>
      </g>`;
    }
    return `<g transform="translate(${cx} ${cy})">
      <path d="M-104 -58 C -60 -84, 60 -84, 104 -56 C 124 -20, 120 30, 100 58 C 50 82, -50 84, -102 58 C -124 24, -124 -24, -104 -58 Z" fill="url(#meat)"/>
      <path d="M-70 -50 C -30 -66, 30 -66, 66 -52" stroke="rgba(255,240,200,0.55)" stroke-width="16" fill="none" stroke-linecap="round"/>
      <g stroke="rgba(70,25,5,0.55)" stroke-width="12" stroke-linecap="round">
        <line x1="-70" y1="40" x2="-10" y2="-40"/><line x1="-20" y1="52" x2="44" y2="-34"/><line x1="34" y1="54" x2="90" y2="-16"/>
      </g>
    </g>`;
  };
  return `<g transform="rotate(-38 512 512)">
    <rect x="502" y="70" width="20" height="900" rx="10" fill="url(#stick)"/>
    ${piece(512, 250, 'meat')}
    ${piece(512, 392, 'negi')}
    ${piece(512, 534, 'meat')}
    ${piece(512, 676, 'negi')}
    ${piece(512, 818, 'meat')}
  </g>`;
}

const defs = `<defs>
  <linearGradient id="meat" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f0b45a"/><stop offset="0.55" stop-color="#c46f22"/><stop offset="1" stop-color="#8a4413"/>
  </linearGradient>
  <linearGradient id="negi" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e3f2b8"/><stop offset="1" stop-color="#7aa83a"/>
  </linearGradient>
  <linearGradient id="stick" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#c9a96b"/><stop offset="0.5" stop-color="#f4e3b4"/><stop offset="1" stop-color="#b8935a"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.62" r="0.62">
    <stop offset="0" stop-color="#ff8a3d" stop-opacity="0.85"/><stop offset="0.45" stop-color="#c8322b" stop-opacity="0.45"/><stop offset="1" stop-color="#1d2b4f" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#26386a"/><stop offset="1" stop-color="#141d38"/>
  </linearGradient>
</defs>`;

const background = `<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>`;
const svg = (inner, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${inner}</svg>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  async function shot(file, w, h, body, transparent = false) {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : '#000'}">${body}</body></html>`);
    await p.screenshot({ path: path.join(out, file), omitBackground: transparent });
    console.log('wrote assets/' + file);
  }
  // アイコン（透過なし）
  await shot('icon-only.png', 1024, 1024, svg(background + skewer()));
  // アダプティブアイコン：前景（透過。端が切られるので 70% に縮める）と背景
  await shot('icon-foreground.png', 1024, 1024,
    svg(`<g transform="translate(512 512) scale(0.7) translate(-512 -512)">${skewer()}</g>`), true);
  await shot('icon-background.png', 1024, 1024, svg(background));
  // 起動画面（2732×2732。中央にアイコン）
  const splash = (bg) => `<div style="width:2732px;height:2732px;background:${bg};display:flex;align-items:center;justify-content:center">
    <div style="width:900px;height:900px;border-radius:200px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.5)">${svg(background + skewer(), 900)}</div></div>`;
  await shot('splash.png', 2732, 2732, splash('#1a120d'));
  await shot('splash-dark.png', 2732, 2732, splash('#1a120d'));
  await b.close();
})();
