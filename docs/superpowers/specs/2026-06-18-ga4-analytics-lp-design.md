# GA4 アナリティクス導入（LP全体＋小ページ） — 設計

- 日付: 2026-06-18
- 対象リポジトリ: `ymatsuzatech-lp`（Jekyll / GitHub Pages, 独自ドメイン `ymatsuzatech.com`）
- 目的: LP全体と小ページに Google Analytics 4 を導入し、アクセス状況と**検索流入キーワード**を見られるようにする。

## ゴール / 成功条件

1. トップ・各アプリページ・プライバシー・FAQ の全ページで GA4 のページビューが計測される。
2. Google Search Console と連携し、**Google検索の流入キーワード（検索クエリ）**を確認できる状態にする。
3. Google Play / 外部ストアへのクリックをイベントとして計測できる。
4. 測定IDの管理が1箇所に集約され、ページ追加が1行で済む。

## 確定した方針（ブレスト結果）

| 項目 | 決定 |
|---|---|
| 計測ツール | Google Analytics 4（gtag.js） |
| 測定ID | 取得済み（実装時に `G-XXXXXXXXXX` を受領して埋め込む） |
| 設置方式 | **B**: `assets/js/analytics.js` に集約し、各ページは1行の `<script>` で読み込む |
| 検索ワード | Google検索の流入キーワード → **Search Console 連携**が必要 |
| SC 所有権確認 | **meta タグ方式**（`google-site-verification`）を各ページ `<head>` に設置 |
| クリック計測 | あり（ストア/外部リンクのクリックをイベント送信） |
| 同意バナー | 付けない（個人アプリLPには過剰）。`privacy-policy.html` に開示文を追記 |
| 埋め込みアプリ本体 | 対象外（`outbreak-clicker/` 等。二重計測回避） |

## アーキテクチャ

```
assets/js/analytics.js   … GA4 初期化（測定ID・config）＋ ストア/外部リンクのクリック計測（唯一の真実の置き場）
  ▲ 参照
  ├─ 9枚の標準HTML（<head> に <script src> 1行 ＋ SC確認 meta タグ）
  └─ _layouts/default.html（faq.md 用の最小レイアウト。同じ analytics.js を参照）
```

- 9枚のHTMLは front matter を持たない純粋な静的HTML（Jekyll は Liquid 処理しない）。よって `{% include %}` は使えず、各ファイルへ直接 `<script>` 行と meta タグを追記する。
- `faq.md` は front matter ありで Jekyll が処理するが現状 `layout` 未指定で `<head>` を持たない。自前の最小 `_layouts/default.html` を新設し `layout: default` を指定して計測対象に含める（副次的に `<head>`/charset/viewport が整う）。

## 変更ファイル一覧

### 新規作成
- `assets/js/analytics.js`
- `_layouts/default.html`

### `<head>` に2要素を追記（SC確認 meta タグ ＋ analytics.js 読み込み）— 計9枚
- `index.html`
- `gitmd.html`
- `aiegg.html`
- `aiegg-privacy.html`
- `displaymemory.html`
- `kizuna-clicker.html`
- `outbreak-clicker.html`
- `outbreak-clicker-privacy.html`
- `privacy-policy.html`

### その他
- `faq.md`: front matter に `layout: default` を追加
- `privacy-policy.html`: ウェブサイト向け GA4 利用の開示文を**日英両方**に追記（既存はアプリ向け Firebase Analytics の記述。サイト計測として節を分けて明記）
- `_config.yml`: 変更不要の見込み（標準HTMLは未処理のため defaults は不要）

## `assets/js/analytics.js` の設計

```js
// assets/js/analytics.js — GA4 + outbound/store click tracking (single source of truth)
(function () {
  var GA_ID = 'G-XXXXXXXXXX'; // 実装時に実IDを設定

  // 1) gtag.js ローダ
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  // 2) ストア/外部リンクのクリック計測（イベント委譲・1箇所で全リンク対象）
  var STORE_HOSTS = ['play.google.com', 'apps.apple.com', 'apps.microsoft.com'];
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    var isStore = STORE_HOSTS.indexOf(url.hostname) !== -1;
    var isOutbound = url.hostname && url.hostname !== location.hostname;
    if (isStore) {
      gtag('event', 'store_click', { link_url: a.href, link_domain: url.hostname, page_path: location.pathname });
    } else if (isOutbound) {
      gtag('event', 'outbound_click', { link_url: a.href, link_domain: url.hostname, page_path: location.pathname });
    }
  }, true);
})();
```

- ページビュー（`page_view`）は `gtag('config', ...)` で自動送信。
- クリックは委譲リスナ1つで全 `<a>` を捕捉（ボタン個別配線は不要 → ページ追加に強い）。
- ストアドメインは `store_click`、その他外部は `outbound_click` として区別。

## 各ページ `<head>` に追記する内容

```html
<!-- Google Search Console 所有権確認 -->
<meta name="google-site-verification" content="（実装時にSCの確認文字列を設定）" />
<!-- Analytics（GA4） -->
<script async src="/assets/js/analytics.js"></script>
```

- パスはカスタムドメインのルート基準で `/assets/js/analytics.js`（全ページ root 配置のため絶対パスで統一）。

## `_layouts/default.html`（faq.md 用 最小レイアウト）

最小構成の完全HTML骨格に、上記と同じ meta タグ＋ `analytics.js` を含め、本文は `{{ content }}` を差し込む。charset/viewport/title（`{{ page.title }}`）を備える。minima 既定レイアウトには依存しない（自前で完結）。

## 検索ワード（Search Console）runbook

GA4 タグだけでは検索クエリは見られないため、デプロイ後に以下を実施（大半は Google の管理画面操作）:

1. Google Search Console で `https://ymatsuzatech.com/` のプロパティを追加。
2. 所有権確認: 本設計で各ページに入れる `google-site-verification` meta タグで「確認」。
   - 別案: ドメインプロパティ＋DNS TXT（www含め包括的だが DNS 設定が必要）。
3. GA4 管理 → サービス間のリンク設定 → Search Console をリンク。
4. 数日後、検索クエリが Search Console「検索パフォーマンス → クエリ」および GA4 のレポートに表示される（※過去分は遡及しない）。

## プライバシー

- 既存の `privacy-policy.html` は**日英バイリンガル**で、内容は **GitMD アプリ本体**のデータ収集（Firebase Analytics / Crashlytics / Sentry / OAuth トークン / Google Play 購入）を説明するもの。今回の **GA4 はウェブサイト（`ymatsuzatech.com`）側**の計測で別物。
- 対応: 「本ウェブサイトでは Google Analytics 4（Cookie ベース）を利用」という**サイト向けの開示文を新規追記**。アプリの Firebase Analytics と混同しないよう節を分けて明記する。
- **日英の両セクションに追記**（既存ドキュメントのバイリンガル構成に合わせる）。Cookie（`_ga` 等）の利用と、GA オプトアウトアドオンによる無効化手段にも触れる。
- IP は GA4 側で既定で匿名化されるため追加設定不要。
- 同意バナーは導入しない（YAGNI。必要になれば別タスク）。

## スコープ外

- サブディレクトリの埋め込みアプリ本体（`outbreak-clicker/`・`aiegg/`・`ai-foreman/`・`kizuna-clicker/` 等）。`outbreak-clicker` は既に Firebase 系の計測を持つ可能性があり、二重計測回避のため対象外。
- 同意管理バナー。
- カスタムディメンション等の高度な設定。

## 実装に必要な入力（ユーザーから受領）

1. **GA4 測定ID**: `G-6HLJ4Y1VLP` ✅ 受領済み（`assets/js/analytics.js` に設定）
2. **Search Console 確認文字列**: ⏳ 未受領。`google-site-verification` の meta タグは `content="REPLACE_WITH_SEARCH_CONSOLE_TOKEN"` のプレースホルダで実装し、後から差し替える。
   - 取得方法: Search Console で `https://ymatsuzatech.com/` を「URL プレフィックス」で追加 → 「HTML タグ」方式に表示される `content="..."` の値。

## テスト / 検証

- ローカル: `bundle exec jekyll serve`（または `python -m http.server`）でビルドが通り、各ページ `<head>` に script/meta が入っていることを確認。
- 構文: `analytics.js` を Node で読み込みエラーが出ないこと（IIFE の構文チェック）。
- 本番: デプロイ後、GA4 のリアルタイムレポートで各ページのページビューと `store_click` イベントが届くことを確認。
- 9枚＋faq の全ページで `gtag` が読み込まれることを grep で確認。
