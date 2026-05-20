// Unit test for the Discord DOM scanning logic in src/content.js.
// Uses jsdom to build a fake Discord sidebar and verifies that both channels and
// categories are extracted correctly.

const { JSDOM } = require("jsdom");

const GUILD_ID = "1111111111";

function buildFakeDiscord() {
  return new JSDOM(`
    <!doctype html>
    <html><body>
      <nav aria-label="Channels">
        <ul data-list-id="channels-${GUILD_ID}">
          <li data-list-item-id="channels___category-9001">
            <h2>Frontend Team</h2>
          </li>
          <li data-list-item-id="channels___2001">
            <a href="/channels/${GUILD_ID}/2001" aria-label="team-frontend-daily (text channel)">
              <div class="name_abc">team-frontend-daily</div>
            </a>
          </li>
          <li data-list-item-id="channels___2002">
            <a href="/channels/${GUILD_ID}/2002" aria-label="team-frontend-pr (text channel)">
              <div class="name_abc">team-frontend-pr</div>
            </a>
          </li>
          <li data-list-item-id="channels___category-9002">
            <h2>Backend Team</h2>
          </li>
          <li data-list-item-id="channels___3001">
            <a href="/channels/${GUILD_ID}/3001" aria-label="team-backend-daily (text channel)">
              <div class="name_abc">team-backend-daily</div>
            </a>
          </li>
          <li>
            <a href="/channels/${GUILD_ID}/3002" aria-label="team-backend-random (text channel)">
              <div class="name_abc">team-backend-random</div>
            </a>
          </li>
          <li data-list-item-id="channels___category-9003">
            <h2>MAID_AI駆動開発①</h2>
          </li>
          <li data-list-item-id="channels___4001">
            <a href="/channels/${GUILD_ID}/4001" aria-label="MAID-General (voice channel)">
              <div class="name_abc">MAID-General</div>
            </a>
          </li>
          <li data-list-item-id="channels___4002">
            <a href="/channels/${GUILD_ID}/4002" aria-label="MAID-PMPD (voice channel)">
              <div class="name_abc">MAID-PMPD</div>
            </a>
          </li>
        </ul>
      </nav>
    </body></html>
  `, { url: `https://discord.com/channels/${GUILD_ID}/2001` });
}

// --- Copy of scanning functions from src/content.js (kept in sync manually) -

function findChannelListRoot(document) {
  const lists = document.querySelectorAll("[data-list-id]");
  for (const el of lists) {
    const v = el.getAttribute("data-list-id") || "";
    if (v.startsWith("channels")) return el;
  }
  const anchor = document.querySelector('a[href^="/channels/"]');
  return anchor?.closest("nav") || null;
}

function extractNameFromItem(item) {
  const ariaSource =
    item.getAttribute("aria-label") ||
    item.querySelector("[aria-label]")?.getAttribute("aria-label");
  if (ariaSource) {
    const cleaned = ariaSource
      .replace(/\s*\(.*\)\s*$/, "")
      .replace(/^チャンネル\s*[、,]\s*/, "")
      .trim();
    if (cleaned) return cleaned;
  }
  const nameEl = item.querySelector('[class*="name_"], [class*="channelName"]');
  if (nameEl?.textContent?.trim()) return nameEl.textContent.trim();
  const raw = item.textContent?.replace(/\s+/g, " ").trim() || "";
  return raw || "(unknown)";
}

function findPrecedingCategory(el) {
  let cur = el.previousElementSibling;
  while (cur) {
    const itemId = cur.getAttribute?.("data-list-item-id") || "";
    const looksCat =
      /^channels___category/i.test(itemId) ||
      (!!cur.querySelector?.('h2, h3, [role="heading"]') &&
        !cur.querySelector?.('a[href^="/channels/"]'));
    if (looksCat) {
      const headerEl = cur.querySelector?.('h2, h3, [role="heading"]');
      return (headerEl?.textContent || cur.textContent || "").trim();
    }
    cur = cur.previousElementSibling;
  }
  return "";
}

function collectVisibleChannels(document, guildId, channelsOut, categoriesOut, state) {
  const root = findChannelListRoot(document);
  if (!root) {
    state.diag.noRoot = true;
    return;
  }
  state.diag.rootFound = true;

  const items = root.querySelectorAll("[data-list-item-id]");
  state.diag.itemCount = Math.max(state.diag.itemCount || 0, items.length);

  items.forEach((item) => {
    const itemId = item.getAttribute("data-list-item-id") || "";
    if (!itemId.startsWith("channels___")) return;
    const rest = itemId.slice("channels___".length);

    const headerEl = item.querySelector('h2, h3, [role="heading"]');
    const looksLikeCategory =
      /^category/i.test(rest) ||
      (!!headerEl && !item.querySelector('a[href^="/channels/"]'));
    if (looksLikeCategory) {
      const text = (headerEl?.textContent || item.textContent || "").trim();
      if (text) state.currentCategory = text;
      const catId = /^category-(\d+)/.exec(rest)?.[1] || rest;
      const fullId = `cat:${catId}`;
      if (!categoriesOut.has(fullId)) {
        categoriesOut.set(fullId, {
          id: fullId,
          kind: "category",
          name: text,
          href: null,
          childCount: 0,
        });
      }
      state.currentCategoryEntry = categoriesOut.get(fullId);
      return;
    }

    let channelId = null;
    let href = null;
    const numMatch = rest.match(/(\d{5,})$/);
    if (numMatch) channelId = numMatch[1];

    const innerA = item.querySelector('a[href^="/channels/"]');
    if (innerA) {
      const hrefAttr = innerA.getAttribute("href");
      const m = hrefAttr.match(/^\/channels\/(\d+)\/(\d+)/);
      if (m && m[1] === guildId) {
        channelId = channelId || m[2];
        href = hrefAttr;
      } else if (m && m[1] !== guildId) {
        return;
      }
    }

    if (!channelId) return;
    if (!href) href = `/channels/${guildId}/${channelId}`;

    const name = extractNameFromItem(item);
    const entry = {
      id: channelId,
      kind: "channel",
      name,
      category: state.currentCategory,
      categoryId: state.currentCategoryEntry?.id || null,
      href,
    };
    const existing = channelsOut.get(channelId);
    if (!existing) {
      channelsOut.set(channelId, entry);
    } else {
      if (!existing.category && entry.category) existing.category = entry.category;
      if (!existing.categoryId && entry.categoryId) existing.categoryId = entry.categoryId;
      if (existing.name === "(unknown)" && entry.name !== "(unknown)")
        existing.name = entry.name;
    }

    if (state.currentCategoryEntry) {
      state.currentCategoryEntry.childCount++;
      if (!state.currentCategoryEntry.href) state.currentCategoryEntry.href = href;
    }
  });

  const anchors = root.querySelectorAll(`a[href^="/channels/${guildId}/"]`);
  anchors.forEach((a) => {
    const hrefAttr = a.getAttribute("href");
    const m = hrefAttr.match(/^\/channels\/\d+\/(\d+)/);
    if (!m) return;
    const id = m[1];
    if (channelsOut.has(id)) return;
    const wrapper = a.closest("[data-list-item-id]") || a.closest("li") || a;
    channelsOut.set(id, {
      id,
      kind: "channel",
      name: extractNameFromItem(wrapper),
      category: findPrecedingCategory(wrapper),
      categoryId: null,
      href: hrefAttr,
    });
  });
}

// --- Run --------------------------------------------------------------------
function run() {
  const dom = buildFakeDiscord();
  const channels = new Map();
  const categories = new Map();
  const state = { currentCategory: "", currentCategoryEntry: null, diag: {} };
  collectVisibleChannels(dom.window.document, GUILD_ID, channels, categories, state);

  const channelList = [...channels.values()];
  const categoryList = [...categories.values()].filter((c) => c.href);
  const fails = [];

  console.log("\n=== Categories ===");
  categoryList.forEach((c) =>
    console.log(`  📁 ${c.name}  (${c.childCount} ch)  -> ${c.href}`)
  );
  console.log("\n=== Channels ===");
  channelList.forEach((c) =>
    console.log(`  [${c.category || "(no cat)"}] #${c.name} -> ${c.href}`)
  );

  // Channel assertions
  const wantChans = [
    { id: "2001", name: "team-frontend-daily", category: "Frontend Team", categoryId: "cat:9001" },
    { id: "2002", name: "team-frontend-pr", category: "Frontend Team", categoryId: "cat:9001" },
    { id: "3001", name: "team-backend-daily", category: "Backend Team", categoryId: "cat:9002" },
    { id: "3002", name: "team-backend-random", category: "Backend Team", categoryId: null },
    { id: "4001", name: "MAID-General", category: "MAID_AI駆動開発①", categoryId: "cat:9003" },
    { id: "4002", name: "MAID-PMPD", category: "MAID_AI駆動開発①", categoryId: "cat:9003" },
  ];
  if (channelList.length !== wantChans.length) {
    fails.push(`expected ${wantChans.length} channels, got ${channelList.length}`);
  }
  for (const w of wantChans) {
    const got = channelList.find((c) => c.id === w.id);
    if (!got) {
      fails.push(`missing channel ${w.id} (${w.name})`);
      continue;
    }
    if (got.name !== w.name) fails.push(`${w.id}: name "${got.name}" !== "${w.name}"`);
    if (got.category !== w.category)
      fails.push(`${w.id}: category "${got.category}" !== "${w.category}"`);
    if (got.categoryId !== w.categoryId)
      fails.push(`${w.id}: categoryId "${got.categoryId}" !== "${w.categoryId}"`);
  }

  // Category assertions
  const wantCats = [
    { id: "cat:9001", name: "Frontend Team", childCount: 2, href: `/channels/${GUILD_ID}/2001` },
    { id: "cat:9002", name: "Backend Team", childCount: 1, href: `/channels/${GUILD_ID}/3001` },
    { id: "cat:9003", name: "MAID_AI駆動開発①", childCount: 2, href: `/channels/${GUILD_ID}/4001` },
  ];
  if (categoryList.length !== wantCats.length) {
    fails.push(`expected ${wantCats.length} categories, got ${categoryList.length}`);
  }
  for (const w of wantCats) {
    const got = categoryList.find((c) => c.id === w.id);
    if (!got) {
      fails.push(`missing category ${w.id} (${w.name})`);
      continue;
    }
    if (got.name !== w.name) fails.push(`${w.id}: name "${got.name}" !== "${w.name}"`);
    if (got.href !== w.href) fails.push(`${w.id}: href "${got.href}" !== "${w.href}"`);
    if (got.childCount !== w.childCount)
      fails.push(`${w.id}: childCount ${got.childCount} !== ${w.childCount}`);
  }

  console.log("\n=== Verdict ===");
  if (fails.length === 0) {
    console.log("ALL ASSERTIONS PASSED");
    process.exit(0);
  } else {
    console.log("FAILURES:");
    fails.forEach((f) => console.log("  -", f));
    process.exit(1);
  }
}

run();
