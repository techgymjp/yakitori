// Android アプリに同梱する Web ファイルを www/ にコピーする
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const items = ['index.html', 'ads.js', 'fonts', ...fs.readdirSync(root).filter((f) => f.endsWith('.mp3'))];
for (const item of items) {
  const src = path.join(root, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(out, item), { recursive: true });
}
// アプリ用のビルド（npm run build:app ＝ APP_BUILD=1）では、Web 版だけの部分を取り除く。
//   HTML: <!-- web-only --> … <!-- /web-only -->、JS: // web-only:start … // web-only:end、CSS: /* web-only:start */ … /* web-only:end */
// ストアへのリンクなどがアプリに入っていると、審査で「隠した機能」に見えるため（iOS の Guideline 5.6）。
// 取り除いたあとに play.google.com などが残っていたらビルドを止める
if (process.env.APP_BUILD === '1') {
  const file = path.join(out, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/[ \t]*<!-- web-only -->[\s\S]*?<!-- \/web-only -->[ \t]*\r?\n?/g, '');
  html = html.replace(/[ \t]*\/\/ web-only:start[\s\S]*?\/\/ web-only:end[ \t]*\r?\n?/g, '');
  html = html.replace(/[ \t]*\/\* web-only:start \*\/[\s\S]*?\/\* web-only:end \*\/[ \t]*\r?\n?/g, '');
  fs.writeFileSync(file, html);
  for (const f of ['index.html', 'ads.js']) {
    const text = fs.readFileSync(path.join(out, f), 'utf8');
    const bad = ['play.google.com', 'apps.apple.com', 'web-only'].filter((w) => text.includes(w));
    if (bad.length) {
      console.error(`アプリ用のビルドに Web 版だけの部分が残っています（${f}: ${bad.join(', ')}）`);
      process.exit(1);
    }
  }
}

// Google Play 用のビルドでは本番の広告を使う
const mode = process.env.ADMOB_MODE === 'production' ? 'production' : 'test';
fs.writeFileSync(path.join(out, 'ads-config.js'), `// ビルド時に生成\nwindow.AD_MODE = '${mode}';\n`);
// トップ画面に出すバージョン（CI では VERSION_NAME / VERSION_CODE を使う）
const version = process.env.VERSION_CODE
  ? `v${process.env.VERSION_NAME || require('../package.json').version} (build ${process.env.VERSION_CODE})`
  : 'dev';
fs.writeFileSync(path.join(out, 'build-info.js'), `// ビルド時に生成\nwindow.APP_VERSION = '${version}';\n`);
console.log(`built web assets into www/ (${process.env.APP_BUILD === '1' ? 'app' : 'web'}, ads: ${mode}, version: ${version})`);
