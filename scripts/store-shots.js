// Google Play 用の画像（docs/store/）を作る。ゲームを自動操作して撮影する。
// 使い方: npm run build && node scripts/store-shots.js   （Playwright が必要）
//   スクリーンショット 1080×1920（日英 各 4 枚）・フィーチャーグラフィック 1024×500・アイコン 512×512
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const out = path.join(root, 'docs', 'store');
const url = 'file://' + path.join(root, 'www', 'index.html');

(async () => {
  const b = await chromium.launch();
  for (const lang of ['ja', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(url + '?lang=' + lang);
    await p.evaluate(() => { try { localStorage.setItem('yakitori-best', '240'); } catch (e) {} renderBest(); });
    await p.waitForTimeout(600);
    const shot = (name) => p.screenshot({ path: path.join(out, `${lang}-${name}.png`) });

    // 1. トップ画面
    await shot('1-title');

    // 2. 網の上の串（金色のメーター）とお客さんの「さんきゅう！」
    await p.evaluate(() => { startGameWithSound(); });
    await p.waitForTimeout(700);
    await p.evaluate(() => {
      game.spawnInterval = 1e9;
      game.yakitoris.forEach((y) => y.element.remove());
      game.yakitoris = [];
      // 串の種類ごとの焼き加減（金色＝当たり・焼き中・生）
      const kinds = ['negima', 'tebasaki', 'tsukune', 'reba'];
      const progress = { negima: 0.75, tebasaki: 0.85, tsukune: 0.45, reba: 0.15 };
      const orig = Math.random;
      kinds.forEach((k) => {
        // 1 回目の乱数で列（空いている列の先頭）、2 回目で串の種類を決める
        const seq = [0, SKEWER_KEYS.indexOf(k) / SKEWER_KEYS.length + 0.01];
        let n = 0;
        Math.random = () => seq[n++ % 2];
        game.spawnYakitori();
      });
      Math.random = orig;
      game.yakitoris.forEach((y) => { y.cookTime = progress[y.typeKey] * y.targetTime; });
      game.updateYakitoris(0);
      game.score = 85; document.getElementById('score').textContent = '85';
      game.misses = 1; renderLives(1, 5);
      game.showReaction(T().good(skewerName(SKEWER_TYPES.tebasaki), 20), 'good', true);
      game.paused = true; // 撮影中は焼き加減を止める
    });
    await p.waitForTimeout(400);
    await shot('2-grill');

    // 3. あそびかた（お品書き）
    await p.evaluate(() => { game.gameRunning = false; showScreen('howto'); });
    await p.waitForTimeout(300);
    await shot('3-menu');

    // 4. 結果画面（本日の売上）
    await p.evaluate(() => {
      showScreen('playing');
      game.gameRunning = true; game.paused = false;
      game.score = 265; game.continuesUsed = 0;
      game.gameOver();
    });
    await p.waitForTimeout(500);
    await shot('4-result');
    await ctx.close();
  }

  // フィーチャーグラフィック（1024×500）
  const p = await b.newPage({ viewport: { width: 1024, height: 500 } });
  // setContent のページからは file:// を読めないので、画像とフォントは data URL で埋め込む
  const fs = require('fs');
  const dataUrl = (file, type) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
  const icon = dataUrl(path.join(root, 'assets', 'icon-foreground.png'), 'image/png');
  const iconOnly = dataUrl(path.join(root, 'assets', 'icon-only.png'), 'image/png');
  const dela = dataUrl(path.join(root, 'fonts', 'DelaGothicOne-Regular.woff2'), 'font/woff2');
  const zen = dataUrl(path.join(root, 'fonts', 'ZenMaruGothic-Bold.woff2'), 'font/woff2');
  await p.setContent(`<html><head><style>
    @font-face { font-family: 'Dela Gothic One'; src: url('${dela}'); }
    @font-face { font-family: 'Zen Maru Gothic'; src: url('${zen}'); font-weight: 700; }
    body { margin:0; width:1024px; height:500px; overflow:hidden; font-family:'Dela Gothic One';
      background: radial-gradient(ellipse 60% 70% at 70% 100%, rgba(255,106,26,0.55), transparent 70%), linear-gradient(180deg, #26386a, #141d38); }
    .noren { position:absolute; top:0; left:0; right:0; height:46px; background:
      repeating-linear-gradient(90deg, transparent 0 calc(25% - 3px), #141d38 calc(25% - 3px) 25%), #1d2b4f; border-top:8px solid #5a3a22; }
    .title { position:absolute; left:64px; top:150px; color:#fbf6ea; font-size:84px; line-height:1.05; text-shadow:0 6px 0 #c8322b; }
    .title span { color:#f5b83d; }
    .sub { position:absolute; left:68px; top:360px; color:#fbe8c8; font-size:28px; font-family:'Zen Maru Gothic'; font-weight:700; }
    img { position:absolute; right:30px; top:40px; width:470px; height:470px; }
    .lantern { position:absolute; width:56px; height:80px; border-radius:45%; background: radial-gradient(ellipse at 50% 45%, #ff8a5c, #c8322b 60%, #7d1712);
      box-shadow:0 0 30px 8px rgba(255,110,60,0.45); top:70px; }
  </style></head><body><div class="noren"></div>
    <div class="lantern" style="left:560px"></div>
    <div class="title">さんきゅう<br><span>やきとり</span></div>
    <div class="sub">焼き加減を見極めて、串をフリック！</div>
    <img src="${icon}"></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'feature-graphic.png') });

  // アイコン 512×512
  await p.setViewportSize({ width: 512, height: 512 });
  await p.setContent(`<html><body style="margin:0"><img src="${iconOnly}" style="width:512px;height:512px;display:block"></body></html>`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(out, 'icon-512.png') });
  await b.close();
  console.log('wrote docs/store/*.png');
})();
