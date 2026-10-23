// ==UserScript==
// @name         Crocs SA sale watcher (add to cart, no payment)
// @match        https://crocssa.co.za/products/classic-clog-copy-1*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  // ---------- CONFIGURATION ----------
  const SIZE = "7";                         // Size label exactly as shown
  const START = "2026-10-24T10:00:00";      // Sale start ISO string (or null to start immediately)
  const RELOAD_MIN_MS = 1000;
  const RELOAD_MAX_MS = 3500;
  const MAX_MINUTES = 3;                    // Auto-stop timeout
  const CART_URL = "/cart";
  // ------------------------------------

  const K = "crocsWatcher";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isVisible = (el) => el && el.offsetParent !== null && !el.disabled && el.getAttribute("aria-disabled") !== "true";
  const getTxt = (el) => (el.textContent || el.value || "").trim();

  const state = JSON.parse(sessionStorage.getItem(K) || "null") || {
    began: Date.now(),
    done: false,
    stopped: false
  };

  const save = () => sessionStorage.setItem(K, JSON.stringify(state));
  save();

  if (state.done || state.stopped) return;

  if (Date.now() - state.began > MAX_MINUTES * 60000) {
    console.warn("[Watcher] Execution time limit reached. Stopping.");
    return;
  }

  // Floating Emergency Stop Button
  const stopBtn = document.createElement("button");
  stopBtn.textContent = "Stop Watcher";
  stopBtn.style.cssText =
    "position:fixed;left:12px;bottom:12px;z-index:999999;padding:10px 14px;" +
    "background:#d9534f;color:#fff;border:0;border-radius:6px;font:14px sans-serif;" +
    "font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3)";
  stopBtn.onclick = () => {
    state.stopped = true;
    save();
    stopBtn.remove();
    console.log("[Watcher] Manual stop triggered.");
  };
  document.body.appendChild(stopBtn);

  // Helper to locate target size element
  const findSizeElement = () => {
    const candidates = [...document.querySelectorAll(
      "button, [role=button], [role=radio], label, li, input[type=radio], input[type=button]"
    )].filter((el) => !el.closest("table"));

    return candidates.find((el) => {
      const matchText = getTxt(el) === SIZE || el.value === SIZE || el.getAttribute("aria-label") === SIZE;
      return matchText && (isVisible(el) || el.tagName === "INPUT" || el.tagName === "LABEL");
    });
  };

  // Helper to locate Add To Cart button
  const findAddButton = () => {
    return [...document.querySelectorAll("button, [role=button], input[type=submit], .btn")]
      .find((el) => isVisible(el) && /add to (cart|bag|basket)/i.test(getTxt(el)));
  };

  const triggerEvents = (el) => {
    el.click();
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const reloadSoon = (ms) => setTimeout(() => location.reload(), ms);

  (async () => {
    // Scheduled pre-start handling
    if (START) {
      const waitMs = new Date(START).getTime() - Date.now();
      if (waitMs > 1500) {
        console.log(`[Watcher] Scheduled start detected. Waiting ${Math.round(waitMs / 1000)}s...`);
        reloadSoon(waitMs - 500);
        return;
      }
    }

    // Polling loop for rendering and click attempt
    const windowDeadline = Date.now() + 4000;
    let sizeSelected = false;

    while (Date.now() < windowDeadline && !state.stopped) {
      if (!sizeSelected) {
        const sEl = findSizeElement();
        if (sEl) {
          triggerEvents(sEl);
          sizeSelected = true;
          console.log(`[Watcher] Selected size: ${SIZE}`);
          await sleep(250);
        }
      }

      if (sizeSelected) {
        const btn = findAddButton();
        if (btn) {
          btn.click();
          state.done = true;
          save();
          console.log("[Watcher] Item added to cart. Navigating to cart...");
          await sleep(1500);
          location.href = CART_URL;
          return;
        }
      }

      await sleep(100);
    }

    // Refresh cycle if item is not available yet
    if (!state.stopped) {
      const delay = RELOAD_MIN_MS + Math.random() * (RELOAD_MAX_MS - RELOAD_MIN_MS);
      console.log(`[Watcher] Target not ready. Retrying in ${Math.round(delay)}ms...`);
      reloadSoon(delay);
    }
  })();
})();