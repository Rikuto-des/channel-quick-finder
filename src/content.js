(() => {
  if (window.__dcqfInjected) {
    console.log("[DCQF] content script already injected, skipping");
    return;
  }
  window.__dcqfInjected = true;
  console.log("[DCQF] content script loaded", { url: location.href });

  const STORAGE_KEY = "dcqf_favorites";

  // ---------- storage ----------

  async function loadAllFavorites() {
    const data = await chrome.storage.sync.get(STORAGE_KEY);
    return data[STORAGE_KEY] || {};
  }

  async function getFavorites(guildId) {
    const all = await loadAllFavorites();
    return all[guildId] || [];
  }

  async function setFavorites(guildId, list) {
    const all = await loadAllFavorites();
    all[guildId] = list;
    await chrome.storage.sync.set({ [STORAGE_KEY]: all });
  }

  async function toggleFavorite(guildId, channelId) {
    const list = await getFavorites(guildId);
    const i = list.indexOf(channelId);
    if (i === -1) list.push(channelId);
    else list.splice(i, 1);
    await setFavorites(guildId, list);
    return i === -1;
  }

  // ---------- Discord DOM scanning ----------

  function getCurrentGuildId() {
    const m = location.pathname.match(/^\/channels\/(\d+)\//);
    return m ? m[1] : null;
  }

  const log = (...args) => console.log("[DCQF]", ...args);

  function findScrollContainer(el) {
    let node = el?.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  // Find the channel list container. Discord uses a <ul data-list-id="channels-XXX">
  // inside the sidebar nav. We look for any [data-list-id] whose value contains "channels".
  function findChannelListRoot() {
    const lists = document.querySelectorAll("[data-list-id]");
    for (const el of lists) {
      const v = el.getAttribute("data-list-id") || "";
      if (v.startsWith("channels")) return el;
    }
    // Fallback: any nav with channel-shaped anchors
    const anchor = document.querySelector('a[href^="/channels/"]');
    return anchor?.closest("nav") || null;
  }

  function extractNameFromItem(item) {
    // 1) aria-label on item or inner clickable
    const ariaSource =
      item.getAttribute("aria-label") ||
      item.querySelector("[aria-label]")?.getAttribute("aria-label");
    if (ariaSource) {
      // Discord aria-label often looks like "channel-name (channel, category: Foo)"
      const cleaned = ariaSource
        .replace(/\s*\(.*\)\s*$/, "")
        .replace(/^チャンネル\s*[、,]\s*/, "")
        .trim();
      if (cleaned) return cleaned;
    }
    // 2) Element whose class name suggests it's the channel name
    const nameEl = item.querySelector('[class*="name_"], [class*="channelName"]');
    if (nameEl?.textContent?.trim()) return nameEl.textContent.trim();
    // 3) Raw text content (last resort — may include unread badge text)
    const raw = item.textContent?.replace(/\s+/g, " ").trim() || "";
    return raw || "(unknown)";
  }

  function collectVisibleChannels(guildId, channelsOut, categoriesOut, state) {
    const root = findChannelListRoot();
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
            href: null, // filled when first child is encountered
            childCount: 0,
          });
        }
        state.currentCategoryEntry = categoriesOut.get(fullId);
        return;
      }

      // Channel
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

      // attach to currently-active category
      if (state.currentCategoryEntry) {
        state.currentCategoryEntry.childCount++;
        if (!state.currentCategoryEntry.href) state.currentCategoryEntry.href = href;
      }
    });

    // Secondary anchor pass for channels not wrapped in "channels___" items.
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

  // Walk previous siblings of `el` (and previous siblings of its ancestors as a
  // fallback) looking for a category-like header element.
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

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function scanAllChannels(guildId) {
    const channels = new Map();
    const categories = new Map();
    const scanState = { currentCategory: "", currentCategoryEntry: null, diag: {} };
    collectVisibleChannels(guildId, channels, categories, scanState);

    const root = findChannelListRoot();
    const scroller = root ? findScrollContainer(root.querySelector("[data-list-item-id]") || root) : null;

    if (scroller) {
      const originalScrollTop = scroller.scrollTop;
      const step = Math.max(200, scroller.clientHeight - 100);
      scroller.scrollTop = 0;
      await sleep(80);

      let safety = 80;
      let lastTop = -1;
      while (safety-- > 0) {
        scanState.currentCategory = "";
        scanState.currentCategoryEntry = null;
        collectVisibleChannels(guildId, channels, categories, scanState);
        if (
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2 ||
          scroller.scrollTop === lastTop
        ) {
          break;
        }
        lastTop = scroller.scrollTop;
        scroller.scrollTop += step;
        await sleep(60);
      }
      scanState.currentCategory = "";
      scanState.currentCategoryEntry = null;
      collectVisibleChannels(guildId, channels, categories, scanState);
      scroller.scrollTop = originalScrollTop;
    }

    log("scan result", {
      guildId,
      channels: channels.size,
      categories: categories.size,
      rootFound: scanState.diag.rootFound,
      itemCount: scanState.diag.itemCount,
      scrollerFound: !!scroller,
    });
    return {
      channels: [...channels.values()],
      categories: [...categories.values()].filter((c) => c.href), // only navigable categories
      diag: { ...scanState.diag, scrollerFound: !!scroller },
    };
  }

  // ---------- overlay UI ----------

  let overlayEl = null;
  let inputEl = null;
  let listEl = null;
  let state = {
    open: false,
    guildId: null,
    channels: [],
    categories: [],
    favorites: new Set(),
    selectedIndex: 0,
    filtered: [],
    drilledCategoryId: null, // when set, overlay shows only that category's channels
  };

  function buildOverlay() {
    overlayEl = document.createElement("div");
    overlayEl.id = "dcqf-overlay";
    overlayEl.innerHTML = `
      <div class="dcqf-backdrop"></div>
      <div class="dcqf-panel" role="dialog" aria-label="Discord channel finder">
        <div class="dcqf-search">
          <span class="dcqf-search-icon">🔍</span>
          <input type="text" class="dcqf-input" placeholder="カテゴリ/チャネルを絞り込み..." autocomplete="off" spellcheck="false" />
          <span class="dcqf-hint">↑↓ 選択 ・ Enter 開く/掘る ・ Shift+Enter 先頭ch ・ ← / Esc 戻る</span>
        </div>
        <div class="dcqf-list" tabindex="-1"></div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    inputEl = overlayEl.querySelector(".dcqf-input");
    listEl = overlayEl.querySelector(".dcqf-list");

    overlayEl.querySelector(".dcqf-backdrop").addEventListener("click", closeOverlay);
    inputEl.addEventListener("input", renderList);
    inputEl.addEventListener("keydown", handleKey);
    listEl.addEventListener("click", handleListClick);
  }

  function handleKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (state.drilledCategoryId) {
        exitDrillDown();
      } else {
        closeOverlay();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.selectedIndex = Math.min(state.filtered.length - 1, state.selectedIndex + 1);
      renderSelection();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      state.selectedIndex = Math.max(0, state.selectedIndex - 1);
      renderSelection();
      return;
    }
    if (e.key === "ArrowLeft" && state.drilledCategoryId) {
      e.preventDefault();
      exitDrillDown();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = state.filtered[state.selectedIndex];
      if (!item) return;
      activateEntry(item, { directJump: e.shiftKey });
    }
  }

  function activateEntry(item, { directJump = false } = {}) {
    if (item.kind === "category") {
      if (directJump) {
        navigateTo(item); // jump straight to first channel
      } else {
        enterDrillDown(item);
      }
    } else {
      navigateTo(item);
    }
  }

  function enterDrillDown(category) {
    state.drilledCategoryId = category.id;
    state.selectedIndex = 0;
    inputEl.value = "";
    scrollSidebarToCategory(category.id);
    renderList();
    inputEl.focus();
  }

  function exitDrillDown() {
    state.drilledCategoryId = null;
    state.selectedIndex = 0;
    inputEl.value = "";
    renderList();
    inputEl.focus();
  }

  function scrollSidebarToCategory(fullCatId) {
    // fullCatId is "cat:<snowflake>". Discord's element uses
    // data-list-item-id="channels___category-<snowflake>".
    const raw = fullCatId.replace(/^cat:/, "");
    const el =
      document.querySelector(`[data-list-item-id="channels___category-${raw}"]`) ||
      document.querySelector(`[data-list-item-id="channels___${raw}"]`);
    if (el?.scrollIntoView) {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function handleListClick(e) {
    if (e.target.closest(".dcqf-back")) {
      e.stopPropagation();
      exitDrillDown();
      return;
    }
    const row = e.target.closest(".dcqf-row");
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest(".dcqf-star")) {
      e.stopPropagation();
      toggleFavorite(state.guildId, id).then(async () => {
        state.favorites = new Set(await getFavorites(state.guildId));
        renderList();
      });
      return;
    }
    const item = findEntry(id);
    if (!item) return;
    activateEntry(item, { directJump: e.shiftKey });
  }

  function findEntry(id) {
    return (
      state.categories.find((c) => c.id === id) ||
      state.channels.find((c) => c.id === id) ||
      null
    );
  }

  function navigateTo(item) {
    closeOverlay();
    // Prefer clicking the real sidebar anchor so Discord SPA routing kicks in fully
    const anchor = document.querySelector(`a[href="${item.href}"]`);
    if (anchor) {
      anchor.click();
    } else {
      // Fallback: use history pushState + popstate so Discord's router picks it up
      history.pushState({}, "", item.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  function renderList() {
    const q = inputEl.value.trim().toLowerCase();
    const favs = state.favorites;
    const html = [];

    if (state.drilledCategoryId) {
      // ---- drill-down view: channels under the selected category ----
      const cat = state.categories.find((c) => c.id === state.drilledCategoryId);
      const inCat = state.channels.filter(
        (c) => c.categoryId === state.drilledCategoryId ||
               (cat && c.category === cat.name)
      );
      const match = q
        ? inCat.filter((c) => c.name.toLowerCase().includes(q))
        : inCat;
      const favList = match.filter((c) => favs.has(c.id));
      const restList = match.filter((c) => !favs.has(c.id));
      state.filtered = [...favList, ...restList];
      state.selectedIndex = Math.min(state.selectedIndex, state.filtered.length - 1);
      if (state.selectedIndex < 0) state.selectedIndex = 0;

      html.push(
        `<div class="dcqf-back" role="button" tabindex="0">` +
          `← <span class="dcqf-back-label">カテゴリ一覧</span>` +
          `<span class="dcqf-crumb">📁 ${escapeHtml(cat?.name || "")}</span>` +
          `</div>`
      );
      if (favList.length) {
        html.push(`<div class="dcqf-section">★ お気に入り</div>`);
        favList.forEach((c) => html.push(renderRow(c, true)));
      }
      if (restList.length) {
        html.push(`<div class="dcqf-section"># チャネル</div>`);
        restList.forEach((c) => html.push(renderRow(c, false)));
      }
      if (!state.filtered.length) {
        html.push(`<div class="dcqf-empty">このカテゴリにチャネルがありません</div>`);
      }
    } else {
      // ---- top-level view: categories (+ channels when searching) ----
      const matchCats = (e) => !q || e.name.toLowerCase().includes(q);
      const matchChans = (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q));

      const cats = state.categories.filter(matchCats);
      const chans = q ? state.channels.filter(matchChans) : [];
      const all = [...cats, ...chans];
      const favList = all.filter((e) => favs.has(e.id));
      const restCats = cats.filter((e) => !favs.has(e.id));
      const restChans = chans.filter((e) => !favs.has(e.id));
      state.filtered = [...favList, ...restCats, ...restChans];
      state.selectedIndex = Math.min(state.selectedIndex, state.filtered.length - 1);
      if (state.selectedIndex < 0) state.selectedIndex = 0;

      if (favList.length) {
        html.push(`<div class="dcqf-section">★ お気に入り</div>`);
        favList.forEach((c) => html.push(renderRow(c, true)));
      }
      if (restCats.length) {
        html.push(`<div class="dcqf-section">📁 カテゴリ <small>(クリックで中身、Shift+クリックで先頭チャネルへ)</small></div>`);
        restCats.forEach((c) => html.push(renderRow(c, false)));
      }
      if (restChans.length) {
        html.push(`<div class="dcqf-section"># チャネル</div>`);
        restChans.forEach((c) => html.push(renderRow(c, false)));
      }
      if (!state.filtered.length) {
        if (!state.channels.length && !state.categories.length) {
          const d = state.lastDiag || {};
          const reason = !d.rootFound
            ? "サイドバーが見つかりません (data-list-id=channels-* なし)"
            : !d.itemCount
            ? "サイドバーは見つかりましたが項目が0件です"
            : `${d.itemCount}件の項目をスキャンしましたが認識できませんでした`;
          html.push(
            `<div class="dcqf-empty">取得できませんでした。<br>` +
              `<small>${escapeHtml(reason)}</small><br>` +
              `<small>DevTools のコンソールに [DCQF] のログがあります</small></div>`
          );
        } else {
          html.push(`<div class="dcqf-empty">該当なし</div>`);
        }
      }
    }

    listEl.innerHTML = html.join("");
    renderSelection();
  }

  function renderRow(c, isFav) {
    const star = isFav ? "★" : "☆";
    const starCls = isFav ? "dcqf-star is-fav" : "dcqf-star";
    const isCategory = c.kind === "category";
    const prefix = isCategory ? "📁" : "#";
    const meta = isCategory
      ? `${c.childCount || 0} ch`
      : c.category || "";
    const trailing = isCategory ? `<span class="dcqf-chev">›</span>` : "";
    return `
      <div class="dcqf-row${isCategory ? " is-category" : ""}" data-id="${escapeHtml(c.id)}">
        <button class="${starCls}" title="お気に入りトグル">${star}</button>
        <span class="dcqf-name">${prefix} ${escapeHtml(c.name)}</span>
        <span class="dcqf-cat">${escapeHtml(meta)}</span>
        ${trailing}
      </div>
    `;
  }

  function renderSelection() {
    const rows = listEl.querySelectorAll(".dcqf-row");
    rows.forEach((r) => r.classList.remove("is-selected"));
    const target = rows[state.selectedIndex];
    if (target) {
      target.classList.add("is-selected");
      target.scrollIntoView({ block: "nearest" });
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }

  async function openOverlay() {
    const guildId = getCurrentGuildId();
    log("openOverlay called", { guildId, path: location.pathname });
    if (!guildId) {
      log("no guildId — are you in DMs or @me view? overlay will not open");
      return;
    }
    if (!overlayEl) buildOverlay();

    state.open = true;
    state.guildId = guildId;
    state.drilledCategoryId = null;
    overlayEl.classList.add("is-open");
    inputEl.value = "";
    listEl.innerHTML = `<div class="dcqf-empty">読み込み中...</div>`;
    inputEl.focus();

    const [scanResult, favs] = await Promise.all([
      scanAllChannels(guildId),
      getFavorites(guildId),
    ]);
    const channels = scanResult.channels;
    const categories = scanResult.categories;

    channels.sort((a, b) => {
      const ca = (a.category || "").localeCompare(b.category || "");
      if (ca !== 0) return ca;
      return a.name.localeCompare(b.name);
    });
    categories.sort((a, b) => a.name.localeCompare(b.name));

    state.channels = channels;
    state.categories = categories;
    state.favorites = new Set(favs);
    state.selectedIndex = 0;
    state.lastDiag = scanResult.diag;
    renderList();
  }

  function closeOverlay() {
    if (!overlayEl) return;
    state.open = false;
    overlayEl.classList.remove("is-open");
  }

  function toggleOverlay() {
    if (state.open) closeOverlay();
    else openOverlay();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    log("message received", msg);
    if (msg?.type === "dcqf:toggle") toggleOverlay();
  });
})();
