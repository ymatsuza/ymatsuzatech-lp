# GA4 アナリティクス導入（LP全体＋小ページ） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ymatsuzatech-lp` の全ページに GA4（`G-6HLJ4Y1VLP`）を導入し、ページビュー・ストア/外部リンククリック・検索流入キーワード（Search Console 連携）を計測できるようにする。

**Architecture:** GA4 のブートストラップとクリック計測を `assets/js/analytics.js` に集約（唯一の真実の置き場）。各標準HTMLは `<head>` に「Search Console 確認 meta タグ ＋ analytics.js 読み込み」の2行を追記。Jekyll が処理する `faq.md` は自前の最小 `_layouts/default.html` 経由で同じ JS を読み込む。`privacy-policy.html` にサイト向け GA4 開示を日英で追記。

**Tech Stack:** 静的HTML / Jekyll(GitHub Pages, theme minima) / gtag.js(GA4) / Google Search Console。検証は `node --check`（JS構文）・`grep`（全ページ被覆）・（あれば）`jekyll build`。

> 参照spec: `docs/superpowers/specs/2026-06-18-ga4-analytics-lp-design.md`
> 注: テストフレームワークの無い静的サイトのため、各タスクの「検証」は構文チェック・全ページ grep・ビルド成功をもって行う（ユニットテストは作らない）。最終的な計測の確証はデプロイ後の GA4 リアルタイムで確認する。

---

## Task 0: 作業ブランチの用意（任意・推奨）

**Files:** なし（git 操作のみ）

- [ ] **Step 1: 現状確認**

Run: `cd /c/Users/ymats/repos/ymatsuzatech-lp && git status && git branch --show-current`
Expected: 作業ツリーがクリーン、現在ブランチ名が表示される。

- [ ] **Step 2: フィーチャーブランチ作成**

```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
git checkout -b feat/ga4-analytics
```

> 注: GitHub Pages はデプロイ元ブランチ（通常 `main`）にマージされて初めて反映される。ブランチで進めて後でマージする方針。直接デフォルトブランチで進めたい場合はこのタスクをスキップ。

---

## Task 1: GA4 ブートストラップ `assets/js/analytics.js` を作成

**Files:**
- Create: `assets/js/analytics.js`

- [ ] **Step 1: ファイルを作成（完全な内容）**

```js
// assets/js/analytics.js
// GA4 + outbound/store click tracking. Single source of truth for the site's web analytics.
(function () {
  var GA_ID = 'G-6HLJ4Y1VLP';

  // 1) Load gtag.js
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  // 2) Outbound / store click tracking (event delegation; covers every <a> on the page)
  var STORE_HOSTS = ['play.google.com', 'apps.apple.com', 'apps.microsoft.com'];
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (STORE_HOSTS.indexOf(url.hostname) !== -1) {
      gtag('event', 'store_click', {
        link_url: a.href, link_domain: url.hostname, page_path: location.pathname
      });
    } else if (url.hostname && url.hostname !== location.hostname) {
      gtag('event', 'outbound_click', {
        link_url: a.href, link_domain: url.hostname, page_path: location.pathname
      });
    }
  }, true);
})();
```

- [ ] **Step 2: JS構文を検証**

Run: `cd /c/Users/ymats/repos/ymatsuzatech-lp && node --check assets/js/analytics.js`
Expected: 出力なし（exit 0）＝構文OK。エラーが出たら修正。

- [ ] **Step 3: コミット**

```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
git add assets/js/analytics.js
git commit -m "feat(analytics): add GA4 bootstrap + click tracking (assets/js/analytics.js)"
```

---

## Task 2: 9枚の標準HTMLの `<head>` に計測タグを追記

**Files (Modify):**
- `index.html`
- `gitmd.html`
- `aiegg.html`
- `aiegg-privacy.html`
- `displaymemory.html`
- `kizuna-clicker.html`
- `outbreak-clicker.html`
- `outbreak-clicker-privacy.html`
- `privacy-policy.html`

各ファイルで、開始タグ `<head>` の直後に次の2行を挿入する（全ページ共通・同一内容）:

```html
<meta name="google-site-verification" content="REPLACE_WITH_SEARCH_CONSOLE_TOKEN" />
<script async src="/assets/js/analytics.js"></script>
```

- [ ] **Step 1: 各ファイルに挿入**

各HTMLについて、`<head>`（行頭の開始タグ）の直後に上記2行を追加する。Edit ツールで anchor=`<head>`、置換後=`<head>` + 改行 + 上記2行。9ファイルすべてに同じ操作を行う。
（`<meta charset>` は2行（約250バイト）追加後も先頭1024バイト内に収まるため問題なし。）

- [ ] **Step 2: 全9ページに入ったか検証**

Run:
```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
echo "analytics.js 参照あり:"; grep -lF "/assets/js/analytics.js" index.html gitmd.html aiegg.html aiegg-privacy.html displaymemory.html kizuna-clicker.html outbreak-clicker.html outbreak-clicker-privacy.html privacy-policy.html | wc -l
echo "site-verification あり:"; grep -lF "google-site-verification" index.html gitmd.html aiegg.html aiegg-privacy.html displaymemory.html kizuna-clicker.html outbreak-clicker.html outbreak-clicker-privacy.html privacy-policy.html | wc -l
```
Expected: 両方とも `9`。

- [ ] **Step 3: コミット**

```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
git add index.html gitmd.html aiegg.html aiegg-privacy.html displaymemory.html kizuna-clicker.html outbreak-clicker.html outbreak-clicker-privacy.html privacy-policy.html
git commit -m "feat(analytics): add GA4 + Search Console verification to all top-level pages"
```

---

## Task 3: `faq.md` を計測対象にする（最小レイアウト新設）

**Files:**
- Create: `_layouts/default.html`
- Modify: `faq.md`（front matter に `layout: default` を追加）

- [ ] **Step 1: `_layouts/default.html` を作成（完全な内容）**

```html
<!doctype html>
<html lang="{{ page.lang | default: 'ja' }}">
<head>
<meta charset="utf-8" />
<meta name="google-site-verification" content="REPLACE_WITH_SEARCH_CONSOLE_TOKEN" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{ page.title | default: site.title }}</title>
<script async src="/assets/js/analytics.js"></script>
</head>
<body>
{{ content }}
</body>
</html>
```

- [ ] **Step 2: `faq.md` の front matter にレイアウトを指定**

`faq.md` 冒頭の front matter を次に変更（`title: FAQ` の下に `layout: default` を追加）:

```yaml
---
title: FAQ
layout: default
---
```

- [ ] **Step 3: 検証（Jekyll があればビルド、無ければファイル確認）**

Run:
```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
# Jekyll が使えるなら:
bundle exec jekyll build 2>/dev/null && echo "JEKYLL_BUILD_OK" && grep -c "/assets/js/analytics.js" _site/faq.html
# 使えない場合のフォールバック:
echo "--- fallback file checks ---"
grep -q "layout: default" faq.md && echo "faq.md layout OK"
grep -q "/assets/js/analytics.js" _layouts/default.html && echo "layout analytics OK"
```
Expected: Jekyll があれば `JEKYLL_BUILD_OK` と `_site/faq.html` 内に analytics.js が1件。無ければフォールバックの2行が両方表示されればOK。

- [ ] **Step 4: コミット**

```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
git add _layouts/default.html faq.md
git commit -m "feat(analytics): cover faq via minimal default layout"
```

---

## Task 4: `privacy-policy.html` にサイト向け GA4 開示を日英で追記

**Files:**
- Modify: `privacy-policy.html`（日本語セクションと English セクションの両方）

既存はアプリ（GitMD）向けの記述（Firebase Analytics 等）。今回は**ウェブサイトの GA4** を別物として明記する。各言語の「データ収集／外部送信先」付近に、次の短い注記を1か所ずつ追加する。

- [ ] **Step 1: 日本語セクションに追記**

日本語側の本文（例: 使用状況収集の説明や外部送信先リストの近く、`<h2>`/`<section>` 区切りが分かる箇所）に、次のブロックを挿入する:

```html
<h2>本ウェブサイトのアクセス解析について</h2>
<p>本ウェブサイト（<code>ymatsuzatech.com</code>）では、訪問状況の把握のため Google Analytics 4（GA4）を使用します。GA4 は Cookie（<code>_ga</code> 等）を用いて、閲覧ページ・参照元・おおまかな地域などの情報を収集します（個人を特定する情報は含みません。IP アドレスは GA4 側で匿名化されます）。これは GitMD アプリ内の計測（Firebase Analytics）とは別のものです。収集を望まない場合は、ブラウザの Cookie 設定、または <a href="https://tools.google.com/dlpage/gaoptout">Google アナリティクス オプトアウト アドオン</a> で無効化できます。</p>
```

- [ ] **Step 2: English セクションに追記**

English 側の対応箇所に、次のブロックを挿入する:

```html
<h2>Analytics on this website</h2>
<p>This website (<code>ymatsuzatech.com</code>) uses Google Analytics 4 (GA4) to understand visitor activity. GA4 uses cookies (such as <code>_ga</code>) to collect information like pages viewed, referrer, and approximate region (no personally identifying information; IP addresses are anonymized by GA4). This is separate from the in-app analytics (Firebase Analytics) of the GitMD app. To opt out, adjust your browser's cookie settings or install the <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out browser add-on</a>.</p>
```

- [ ] **Step 3: 検証**

Run:
```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
grep -c "アクセス解析\|Analytics on this website" privacy-policy.html
grep -c "gaoptout" privacy-policy.html
```
Expected: 1行目が `2`（日英2見出し）、2行目が `2`（日英のオプトアウトリンク）。

- [ ] **Step 4: コミット**

```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
git add privacy-policy.html
git commit -m "docs(privacy): disclose website GA4 usage (JA/EN)"
```

---

## Task 5: 全体検証 ＆ Search Console ランブック

**Files:** なし（検証と手順確認）

- [ ] **Step 1: 全ページ被覆の最終確認**

Run:
```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
echo "標準HTMLでanalytics.jsを参照しているページ数（期待9）:"
grep -lF "/assets/js/analytics.js" *.html | wc -l
echo "analytics.js のGA_ID:"
grep -o "G-[A-Z0-9]\{8,\}" assets/js/analytics.js
node --check assets/js/analytics.js && echo "JS_SYNTAX_OK"
```
Expected: `9`、`G-6HLJ4Y1VLP`、`JS_SYNTAX_OK`。

- [ ] **Step 2: （デプロイ後・手動）GA4 リアルタイム確認**

デプロイ後、各ページを開き GA4 管理画面の「リアルタイム」でページビューが届くこと、Google Play ボタンを押して `store_click` イベントが届くことを確認する。

- [ ] **Step 3: （手動）Search Console 設定＝検索ワード閲覧の有効化**

1. Search Console で `https://ymatsuzatech.com/` を「URL プレフィックス」プロパティとして追加。
2. 所有権確認: 「HTML タグ」方式を選び、表示される `content="..."` の値を取得。
3. その値で、本リポジトリ内すべての `REPLACE_WITH_SEARCH_CONSOLE_TOKEN` を置換（9枚のHTML ＋ `_layouts/default.html`）してコミット・デプロイ → Search Console で「確認」。
4. GA4 管理 → サービス間のリンク設定 → Search Console をリンク。
5. 数日後、Search Console「検索パフォーマンス → クエリ」と GA4 のレポートに検索流入キーワードが表示される（過去分は遡及しない）。

- [ ] **Step 4: トークン置換の検証（トークン受領後）**

Run:
```bash
cd /c/Users/ymats/repos/ymatsuzatech-lp
echo "未置換のプレースホルダ残数（期待0）:"
grep -rF "REPLACE_WITH_SEARCH_CONSOLE_TOKEN" . --include="*.html" | wc -l
```
Expected: トークン置換後は `0`。

---

## Self-Review

**1. Spec coverage（spec の各節 → 対応タスク）**
- GA4 集約（analytics.js）→ Task 1 ✅
- 9枚HTMLへの設置 → Task 2 ✅
- faq.md（レイアウト経由）→ Task 3 ✅
- 検索ワード = Search Console（meta確認＋連携）→ Task 2/3 で meta 設置、Task 5 で連携手順 ✅
- クリック計測 → Task 1（store_click / outbound_click）✅
- プライバシー開示（日英）→ Task 4 ✅
- スコープ外（埋め込みアプリ・同意バナー）→ 計画に含めない ✅

**2. Placeholder scan**
- `REPLACE_WITH_SEARCH_CONSOLE_TOKEN` は意図的なプレースホルダ（SC トークン未受領）。Task 5 Step 3/4 で差し替え＆検証を明記済み。TODO/TBD 等の未解決項目なし。

**3. Type/identifier consistency**
- GA_ID `G-6HLJ4Y1VLP`、イベント名 `store_click`/`outbound_click`、パス `/assets/js/analytics.js`、レイアウト名 `default` — 全タスクで一貫。
