# さんきゅうやきとり (Thank You Yakitori)

焼き鳥屋さんのブラウザゲームです。網の上で焼ける串を、**ちょうどいい焼き加減**のときに上へフリックしてお客さんに出します。

`index.html` をブラウザで開くだけで遊べます（Web 版はビルド不要）。Android アプリ版もあります（下記）。

## あそびかた

- 串は 5 種類。焼き時間（「当たり」になるまで）がそれぞれ違います

  | 串 | 当たり（ゲーム開始時） | 得点 |
  | --- | --- | --- |
  | レバー | 1.2〜2.0 秒 | 15 点 |
  | ねぎま | 1.8〜3.0 秒 | 10 点 |
  | もも | 2.1〜3.5 秒 | 10 点 |
  | つくね | 2.4〜4.0 秒 | 15 点 |
  | 手羽先 | 3.0〜5.0 秒 | 20 点 |

- 串の上のメーターが **金色** のうちに上へフリックすると「さんきゅう！」で得点。生焼け・焦げを出すと「こらー！」でミス
- 焦げた串は **下へフリック** で捨てればミスになりません。放っておくと燃え尽きてミス
- ミス 5 回で閉店（ゲームオーバー）。売上 50 点ごとに焼けるのが速くなります
- 指ごとに別々に串をつかめるので、両手の親指で遊べます
- 日本語と英語に対応（端末の言語で自動選択。トップ画面・結果画面のボタンで切り替え。`?lang=en` / `?lang=ja` でも指定可）
- 結果画面からシェアできます（シェア文には紹介記事 https://techgym.jp/column/claude-code-game-yakitori/ が入ります）
- ベスト記録は端末に保存されます
- Web 版のトップ画面と「あそびかた」に、Android アプリ版（Google Play）へのリンク（新しいタブで開く）。アプリの中には入れていません（下記）

## 音

- BGM はお祭り囃子風の曲を Web Audio API で生成しています（売上が増えるとテンポアップ）
- 効果音は同梱の mp3（`start.mp3` `omachi.mp3` `39.mp3` `kora.mp3` `gong.mp3`、焼ける音 `yaki.mp3`）

## Android アプリ

[Capacitor](https://capacitorjs.com/) でゲームのファイルをアプリに同梱し、Android アプリにしています（オフラインで遊べます）。
構成は techgymjp/jet-fighter の `docs/ANDROID_PORTING.md`、techgymjp/corner-kick と同じです。

**動作確認用 APK**（テスト広告。Google Play 版ではありません）

- リリース画面: https://github.com/techgymjp/yakitori/releases/tag/android-latest
- APK 直接: https://github.com/techgymjp/yakitori/releases/latest/download/yakitori.apk

<img src="docs/apk-qr.png" width="200" alt="リリース画面の QR コード">

- パッケージ名: `jp.techgym.yakitori`
- アプリ名: さんきゅうやきとり（英語の端末では Yakitori）
- 縦画面固定・全画面・プレイ中は画面を消さない
- トップ画面は「開店」「あそびかた」だけにして、お品書き（串ごとの当たり秒数・得点）は「あそびかた」画面にまとめています
- 戻るボタン: プレイ中はひと休み（ひと休み中なら再開）、あそびかたではトップへ、トップ・結果画面ではアプリを終了
- 別アプリに切り替えると自動でひと休みして音を止める（画面右上の ⏸ ボタン、PC では P / Esc キーでもひと休み）
- シェアは Android の共有メニュー
- フォント（Dela Gothic One・Zen Maru Gothic）は画面で使う文字だけに絞って同梱（`fonts/`。文言を変えたら `python3 scripts/subset-fonts.py`）
- 広告（AdMob）
  - バナー: トップ・あそびかた・ひと休み・結果画面の下中央（プレイ中は網の串と重なるので出さない）
  - 全画面広告（インタースティシャル）: 「開店」（トップ・あそびかたから）、「トップへ」（あそびかた・ひと休み・結果画面から）、結果画面の「もう一度」、ひと休みからの「再開」のたびに毎回
  - リワード広告（チート）: ミス 5 回で閉店になるとき「広告を見てミスを1つ取り消す」（1 ゲーム 1 回まで。燃え尽きた串やお客さんの反応を見届けられるよう 2.2 秒後に出し、6 秒で自動的に閉店へ）。
    見終わるとミスが 4 回に戻り、網の上の焦げた串を片付けてから再開。使ったことは結果画面とシェア文に「延長1回」と出る
  - EU など同意が必要な地域ではトップ画面に「広告の設定」
- トップ画面にバージョン（ビルド番号）とプライバシーポリシーへのリンク

**Web 版だけの部分**：Google Play へのリンクなど Web 版だけの部分は、`<!-- web-only -->` … `<!-- /web-only -->`（HTML）、`// web-only:start` … `// web-only:end`（JS）、`/* web-only:start */` … `/* web-only:end */`（CSS）で囲んでいます。
アプリ用のビルド `npm run build:app`（`APP_BUILD=1`）では、この範囲を取り除き、`play.google.com` などが残っていたらビルドを止めます（ストアへのリンクや端末で隠す処理がアプリに入っていると、iOS の審査で「隠した機能」と見られるため）。
Web 版の公開（Vercel）は従来どおり `npm run build` です。

ビルドは GitHub Actions（`.github/workflows/android.yml`）で行います。

1. `npm ci` → `npm run build:app`（`www/` に Web ファイルをコピーし、`ads-config.js` と `build-info.js` を生成）→ `npx cap sync android` → `./gradlew assembleDebug`
2. 既定ブランチなら、Release `android-latest` の `yakitori.apk` を差し替え（動作確認用・テスト広告。QR コード: `docs/apk-qr.png`）
3. GitHub Secrets に署名鍵（`ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD`）があれば、本番広告で署名付き AAB を作り Artifact に上げる

AdMob のアプリ ID は `android/app/src/main/res/values/strings.xml` の `admob_app_id`、本番の広告ユニット ID は `ads.js` の `UNITS.android.production` にあります。
動作確認用 APK はどれもテスト広告、Google Play 用の AAB は本番の広告です（広告ユニット ID が空の種類は出さない）。

手元で試すとき: `npm install` → `npm run android:sync` → `npm run android:open`（Android Studio が必要）。
アイコンと起動画面は `assets/` の元画像（`node scripts/make-icons.js` で作成）から `npx @capacitor/assets generate --android` で生成しています。

ストアの掲載文とスクリーンショットは `docs/store/` にあります。

## ファイル

| ファイル | 内容 |
| --- | --- |
| `index.html` | ゲーム本体（画面・串・判定・BGM・日本語 / 英語の文言） |
| `ads.js` | 広告（Android アプリのときだけ動く） |
| `*.mp3` | 効果音・焼ける音 |
| `fonts/` | 同梱フォント（SIL Open Font License） |
| `android/` | Android アプリのプロジェクト（Capacitor） |
| `scripts/` | Web ファイルのコピー・アイコン作成・フォントの絞り込み |

## ライセンス

著作権はテックジム株式会社に帰属します（All rights reserved）。許可なく複製・改変・再配布すること、Web サイトやアプリとして公開・販売すること、名前・ロゴ・アイコン・画像を使うことを禁止します。
テックジムの受講生が学習目的で複製・改変することは許可しますが、アプリストアでの公開・広告の掲載・販売などの商用利用は禁止し、著作権表示を残してください。
同梱のフォントは SIL Open Font License 1.1 です。詳しくは [LICENSE](LICENSE) を見てください。

## English

**Thank You Yakitori** — a yakitori grill game. Flick each skewer up to the customer when its meter is gold (grilled just right).
Five kinds of skewers with different grill times, burnt skewers can be flicked down to toss them, and 5 misses close the shop.
Open `index.html` in a browser to play. An Android app (Capacitor) is built by GitHub Actions.
