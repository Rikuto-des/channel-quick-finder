# Channel Quick Finder

> **Unofficial** Chrome extension that adds a keyboard-shortcut search overlay to
> the Discord web app. Not affiliated with, endorsed, sponsored, or approved by
> Discord Inc. "Discord" is a trademark of Discord Inc., referenced here only to
> describe the website this extension works on.

Discord ブラウザ版 (`https://discord.com/channels/*`) で、ショートカット一発で
**カテゴリ/チャネルを検索 & ドリルダウン**できる Chrome 拡張機能。30チーム規模の業務サーバーで
「自分の入るチャネルを毎回探す」のがしんどい人向け。

## できること

- **ショートカット起動**: `Option+Shift+K` (Mac) / `Alt+Shift+K` (Win) でオーバーレイを開く
- **カテゴリ主体**: デフォルト表示は **カテゴリ一覧**
- **ドリルダウン**: カテゴリをクリックすると中身のチャネル一覧に潜る (同時に Discord サイドバーがそのカテゴリ位置までスクロール)
- **ショートカット動作**:
  - `Enter` / クリック → カテゴリは潜る、チャネルは遷移
  - `Shift+Enter` / `Shift+クリック` → カテゴリの先頭チャネルに直接ジャンプ
  - `←` / `Esc` / 戻るボタン → ドリルダウンから戻る、トップでは閉じる
- **絞り込み検索**: 入力するとカテゴリ + チャネル両方ヒット (ドリルダウン中はそのカテゴリ内に限定)
- **お気に入り (★)**: カテゴリ/チャネルどちらでもピン留め可 (サーバーごと保存)

## 動作の透明性

- ❌ Discord の API を一切呼ばない
- ❌ アカウントを自動操作しない (メッセージ送信などはしない)
- ✅ 画面に描画された DOM のみを参照
- ✅ お気に入りは `chrome.storage.sync` (Google同期) にのみ保存。外部送信ゼロ
- ✅ アナリティクス / トラッキング一切なし

詳細は [PRIVACY.md](./PRIVACY.md) を参照。

## インストール (開発者モード)

1. Chrome で `chrome://extensions` を開く
2. 右上の「**デベロッパーモード**」を ON
3. 「**パッケージ化されていない拡張機能を読み込む**」をクリック
4. このリポジトリのルートフォルダを選択
5. `https://discord.com/channels/...` を開いて `Option+Shift+K` を押すと検索オーバーレイが出ます

## ショートカットの変更

`chrome://extensions/shortcuts` から自由に変更できます。

## 開発

```bash
npm install                  # devDependencies (jsdom + sharp)
npm test                     # DOM スキャンの jsdom テスト
node scripts/build-icons.js  # アイコン (SVG → 4サイズPNG) を再生成
```

## 制約・既知の挙動

- Discord は左サイドバーを仮想スクロールで描画するため、オーバーレイを開くタイミングで一度サイドバーをスキャンします (一瞬スクロールが動きます)
- Discord 側の UI 大幅変更でセレクタが壊れる可能性あり。その場合は `src/content.js` の `collectVisibleChannels` / `extractNameFromItem` / `findChannelListRoot` を調整してください

## ファイル構成

```
.
├── manifest.json
├── src/
│   ├── background.js     # ショートカット受信 → content への中継 (Service Worker)
│   ├── content.js        # DOM スキャン + オーバーレイUI + お気に入り永続化
│   └── overlay.css       # オーバーレイのスタイル
├── icons/                # 拡張機能アイコン (16/32/48/128 PNG + SVG原本)
├── scripts/
│   └── build-icons.js    # アイコン生成スクリプト (sharp 使用)
├── test/
│   └── test-dom-scan.js  # jsdom ベースの DOM スキャン単体テスト
├── PRIVACY.md            # プライバシーポリシー
├── STORE_LISTING.md      # Chrome Web Store 提出用テキスト原稿
└── README.md
```

## リリース

Chrome Web Store に出す場合の手順は [STORE_LISTING.md](./STORE_LISTING.md) に提出原稿あり。

## ライセンス

MIT
