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

## Affiliation

This is an **unofficial third-party tool**. It is not affiliated with,
endorsed, sponsored by, or approved by Discord Inc. "Discord" is a trademark of
Discord Inc., used here only descriptively to indicate which website the
extension works on.

## Contact

Issues and questions: [GitHub Issues](https://github.com/Rikuto-des/channel-quick-finder/issues)

## Changes to this policy

If this policy ever changes, the new version will be committed to this
repository and the `Last updated` date above will change. There are no email
notifications because no email address has ever been collected.
