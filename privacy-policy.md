---
title: Privacy Policy
---

# プライバシーポリシー

**GitMD**（旧称: GitNote）  
最終更新日: 2026-05-17

---

## 1. 収集する情報

GitMD が収集・保存する情報は以下のみです。すべてお使いの端末内にのみ保存されます。

| 情報 | 用途 | 保存場所 |
|------|------|----------|
| GitHub / GitLab OAuth アクセストークン | リポジトリへの読み書き認証 | 端末内（Android Keystore で暗号化） |
| 個人アクセストークン（PAT） | カスタム Git ホストへの認証 | 端末内（Android Keystore で暗号化） |
| リポジトリ URL・ブランチ名・認証種別 | クローン・同期先の特定 | 端末内（DataStore） |
| Git コミット用の著者名・メールアドレス | コミットメタデータへの記録 | 端末内（DataStore） |
| Markdown ファイル | ノートの表示・編集 | 端末内（アプリ専用ストレージ） |
| お気に入り / 最近開いたノートのパス | UI 状態の保持 | 端末内（DataStore） |

## 2. 使用状況の収集（Firebase Analytics）

アプリの品質向上を目的として、以下を Firebase Analytics（Google）に送信します。

| 情報 | 用途 |
|------|------|
| アプリの起動・主要操作（ノート作成・保存・Push 成功）のイベント名 | 機能の利用状況の把握、不具合の検知 |
| クラッシュレポート | クラッシュ原因の特定 |
| 国名（おおまかな地域） | 言語ローカライズの優先度判断 |

**収集しない情報（明示的に無効化済み）**:

- 広告 ID（Android Advertising ID, AAID）
- SSAID（Settings.Secure.ANDROID_ID）
- 個人を特定できる情報（メールアドレス、電話番号、氏名、ノート本文など）
- 位置情報
- 連絡先・カメラ・マイクなどのセンサーデータ
- Google Signals（他の Google サービスでの行動との紐付け）

## 3. 第三者への提供

GitMD はいかなる個人情報も第三者に提供・販売しません。

アプリが通信する外部サービスは以下のみです。

- **GitHub API / GitLab API**: リポジトリ一覧の取得・認証
- **ユーザー自身の Git リポジトリ**: ノートファイルの同期
- **Firebase Analytics（Google）**: 上記「2. 任意で収集する情報」に書かれたイベントのみ、ユーザーが許可した場合に限り送信

これらの通信はすべて HTTPS / SSH で行われます。

## 4. データの管理・削除

- アプリをアンインストールすると、端末に保存されたすべてのデータ（トークン・設定・クローン済みファイル）は削除されます。
- GitHub / GitLab アカウントとの連携を解除するには、各サービスの設定画面（[GitHub](https://github.com/settings/applications) / [GitLab](https://gitlab.com/-/profile/applications)）から GitMD のアクセス許可を取り消してください。
- Firebase Analytics に送信済みのデータの削除をご希望の場合は、お問い合わせ先までご連絡ください。

## 5. お問い合わせ

プライバシーに関するご質問は、メール（<ymatsuza.tech@gmail.com>）または[テスター向け Google グループ](https://groups.google.com/g/gitmd-testers)までご連絡ください。
