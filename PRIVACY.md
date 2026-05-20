# Privacy Policy — Channel Quick Finder

_Last updated: 2026-05-20_

## Summary (TL;DR)

This extension does **not** collect, transmit, or share any personal data. All
state is stored locally in your browser. There is no analytics, no telemetry,
and no external server.

## What this extension does

Channel Quick Finder is a Chrome extension that adds a keyboard-shortcut search
overlay to the Discord web app (`https://discord.com/channels/*`). When you
press the configured shortcut (default: `Alt+Shift+K`), it:

1. Reads the channel list **rendered in your own browser** (DOM only — no API
   calls, no automation).
2. Shows you a searchable overlay so you can find a category or channel and
   navigate to it.

## What data is stored

The extension stores the following data **only** via the browser's standard
`chrome.storage.sync` API:

| Data | Where | Why |
|---|---|---|
| Your starred favorites (category and channel IDs, keyed by Discord server ID) | `chrome.storage.sync` | So your favorites persist between sessions and across signed-in Chrome devices |

That is the entire data footprint.

## What data is NOT stored or transmitted

- ❌ No Discord credentials, tokens, or account information
- ❌ No message content
- ❌ No usage analytics or telemetry
- ❌ No network requests to any third-party server
- ❌ No advertising or tracking identifiers
- ❌ The extension does not call Discord's API and does not automate any
  account actions (no message sending, no clicking on your behalf)

## Permissions explanation

| Permission | Why it is requested |
|---|---|
| `storage` | To save your favorites locally via `chrome.storage.sync` |
| Host permission for `https://discord.com/channels/*` (via `content_scripts`) | So the search overlay can render inside the Discord tab and read the sidebar DOM that is already visible to you |

The extension requests **no other permissions**.

## Where favorites sync to

`chrome.storage.sync` is provided by Chrome. If you are signed into Chrome and
have sync enabled, Chrome will synchronize this small data blob across your
signed-in devices. It is **not** shared with the extension author or any third
party. See [Google Chrome's privacy notice](https://www.google.com/chrome/privacy/)
for details.

## Affiliation & Disclaimer / 免責事項

This extension is an **unofficial, independently developed third-party tool**.
It is not affiliated with, endorsed by, sponsored by, or in any way connected
to Discord Inc. "Discord" is a trademark of Discord Inc., referenced solely
descriptively to identify the website on which the extension operates.

**Use at your own risk.** The full warranty disclaimer, limitation of liability,
indemnification, and other legal terms are set out in the [Terms of Use](./TERMS).
By installing or using this extension you agree to those Terms.

In particular, and without limiting the [Terms of Use](./TERMS):

- The extension is provided "AS IS" and "AS AVAILABLE", without any warranty
  of any kind, express or implied.
- The author shall not be liable for any direct, indirect, incidental,
  special, exemplary, consequential, or punitive damages arising from use of
  or inability to use the extension — including loss of data, loss of access
  to Discord, any restriction or termination of the user's Discord account by
  Discord Inc., or any claim brought by Discord Inc. or any third party.
- The user agrees to indemnify and hold the author harmless from any claim
  arising out of the user's use of the extension or violation of any third
  party's terms (including Discord's Terms of Service).

---

本拡張機能は、**非公式の独立した第三者製ツール**です。Discord Inc. による開発・承認・
後援・その他いかなる関係も一切ありません。"Discord" は Discord Inc. の商標であり、
本拡張機能が動作するウェブサイトを識別する目的でのみ言及しています。

**自己責任**でご利用ください。保証否認・責任制限・補償等のすべての法的条件は
[利用規約 (Terms of Use)](./TERMS) に定められています。本拡張機能をインストール
または使用することで、利用者は当該規約に同意したものとみなされます。

特に、[利用規約](./TERMS) を限定するものではないが:

- 本拡張機能は「現状有姿 (AS IS)」かつ「提供可能な範囲 (AS AVAILABLE)」で提供され、
  明示・黙示を問わずいかなる種類の保証も伴いません。
- 作者は、本拡張機能の使用または使用不能から生じる、いかなる直接的・間接的・付随的・
  特別・模範的・結果的・懲罰的損害についても一切責任を負いません。これには、データの
  損失、Discord へのアクセス喪失、Discord Inc. による利用者のアカウントへの制限・終了、
  Discord Inc. または第三者から提起されるあらゆる請求を含みます。
- 利用者は、本拡張機能の使用または第三者規約 (Discord の利用規約を含む) の違反に
  起因する一切の請求から作者を補償し、損害を被らせないことに同意します。

## Contact

Issues and questions: [GitHub Issues](https://github.com/Rikuto-des/channel-quick-finder/issues)

## Changes to this policy

If this policy ever changes, the new version will be committed to this
repository and the `Last updated` date above will change. There are no email
notifications because no email address has ever been collected.
