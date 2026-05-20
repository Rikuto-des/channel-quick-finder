# Chrome Web Store 提出用テキスト一式

このファイルはストア提出フォームにコピペするための原稿集です。

---

## 拡張機能名 (Name) — 45文字以内

```
Channel Quick Finder
```

## 概要 / Summary — 132文字以内

```
Discord ブラウザ版のサイドバーを、ショートカット一発でカテゴリ/チャネル検索 & ドリルダウン。30チームあっても迷子にならない。
```

英語版 (もし英語ストアにも出す場合):

```
Keyboard-shortcut search overlay for the Discord web app: drill into categories, find channels fast, pin favorites. Unofficial.
```

## 詳細説明 / Detailed description

```
■ 何ができる

Discord のブラウザ版 (https://discord.com/channels/*) で、Alt+Shift+K (Mac: Option+Shift+K) を押すと検索オーバーレイが開きます。

・カテゴリ一覧をデフォルト表示 (チャネルが多すぎる時に便利)
・カテゴリをクリック → そのカテゴリの中身にドリルダウン + Discord サイドバーも同時にそのカテゴリ位置へスクロール
・Shift+クリックでそのカテゴリの先頭チャネルへ直接ジャンプ
・検索ボックスでカテゴリ名 / チャネル名を絞り込み
・お気に入り (★) でよく使うカテゴリ/チャネルを最上部にピン留め (サーバーごと別)
・キーボード操作: ↑↓ で選択、Enter で確定、← / Esc で戻る

■ 想定ユーザー

30チーム × 30カテゴリ規模の業務用 Discord サーバーで「自分の入るチャネルを毎回探す」のがしんどい人。Cmd+K (標準のクイックスイッチャー) では足りない人向け。

■ 動作の透明性

・Discord の API は一切呼びません
・アカウントを自動操作しません (メッセージ送信などはしない)
・お気に入りは chrome.storage.sync (Google アカウント同期) にのみ保存され、外部送信はゼロ
・アナリティクス・トラッキング一切なし

ソースコード公開: https://github.com/Rikuto-des/channel-quick-finder

■ 免責事項

この拡張機能は非公式の第三者製ツールであり、Discord Inc. による開発・承認・後援は一切受けていません。"Discord" は Discord Inc. の商標であり、対応サービスを示すためにのみ言及しています。

This is an unofficial third-party tool, not affiliated with, endorsed, sponsored, or approved by Discord Inc. "Discord" is a trademark of Discord Inc., referenced only to describe the website this extension works on.
```

## カテゴリ

`Productivity` (生産性向上)

## 言語

Primary: `日本語` / English

## 単一目的 (Single Purpose Description)

Chrome Web Store の審査で必須:

```
Provide a keyboard-shortcut search overlay for the Discord web app sidebar so users can quickly find and navigate to categories and channels by name, with optional favorites.
```

## 権限の説明 (Permissions Justification)

### `storage` 権限

```
Used to persist the user's favorite categories and channels via chrome.storage.sync so their favorites are restored between sessions and across signed-in Chrome devices. No other data is stored.
```

### Host permission (`https://discord.com/channels/*`)

```
The extension's content script needs to inject the search overlay into the Discord web app and read the visible channel sidebar DOM in order to enumerate categories and channels. The extension does not call Discord's API and does not access any other site.
```

### Remote code

```
None. This extension contains no remote code and loads no external scripts.
```

## プライバシー (Privacy practices)

- **Personally identifiable information**: No
- **Health information**: No
- **Financial and payment information**: No
- **Authentication information**: No
- **Personal communications**: No
- **Location**: No
- **Web history**: No
- **User activity**: No
- **Website content**: ❗ "Yes — but only for the user's currently active Discord tab, read-only, and only the channel/category names visible in the user's own sidebar. Data never leaves the device except via the user's own Chrome sync."

## プライバシーポリシーURL

GitHub Pages で PRIVACY.md を HTML レンダリングして公開:

```
https://rikuto-des.github.io/channel-quick-finder/PRIVACY
```

(レガシーURL: `https://raw.githubusercontent.com/Rikuto-des/channel-quick-finder/main/PRIVACY.md` — テキストだけ見たい時用)

## スクリーンショット (1280×800 or 640×400 を1〜5枚)

撮るべきもの:
1. オーバーレイのトップ画面 (カテゴリ一覧)
2. ドリルダウン中の画面
3. お気に入り登録した状態
4. 検索で絞り込んだ状態

実 Discord で撮るとアカウント情報が映るので、テストサーバー or モックを使う。

## ホームページURL

```
https://github.com/Rikuto-des/channel-quick-finder
```
