# AutomationScripts
Lightweight Tampermonkey/Violentmonkey script for monitoring Shopify product availability, selecting target sizes, and auto-adding items to cart upon drop.


# 🐊 Crocs SA Sale Watcher

A lightweight, client-side Userscript (compatible with **Tampermonkey**, **Violentmonkey**, and **Greasemonkey**) designed to automate product drops on the Crocs South Africa storefront (`crocssa.co.za`).

It continuously checks product availability, auto-selects your designated size, triggers native Shopify form events, adds the item to your cart as soon as the drop goes live, and redirects you directly to `/cart`.

> ⚠️ **Important:** This script **does NOT handle checkout or payment**. It stops strictly upon adding the item to your cart and bringing you to the cart page so you can manually complete purchase details.

---

## ✨ Features

- **Automated Size Selection**: Sweeps the DOM for target size buttons, radio inputs, or labels and auto-selects them.
- **Event Dispatching**: Sends explicit `change` and `input` events to ensure Shopify JS state frameworks update correctly.
- **Scheduled Pre-Drop Refresh**: Sit on the product page before launch; the script automatically triggers a refresh right as the drop starts.
- **Humanized Randomization**: Uses random delay intervals between reload cycles to prevent rapid-fire blocking.
- **Safety Auto-Stop**: Hard stop timer prevents infinite background reloads if an item sells out or stays unavailable.
- **UI Emergency Stop**: Injects a prominent floating "Stop Watcher" button directly onto the screen for instant manual cancellation.

---

## 💾 Installation

1. Install a userscript manager browser extension:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Open your userscript extension dashboard and click **Create a new script**.
3. Copy and paste the contents of [`crocs-watcher.user.js`](./crocs-watcher.user.js) into the editor.
4. Update the configuration parameters (see below) and click **Save**.

---

## ⚙️ Configuration

Edit the variables at the top of the script before activating:

```javascript
// ---------- CONFIGURATION ----------
const SIZE = "7";                    // Size label exactly as shown on site (e.g., "7")
const START = "2026-10-24T10:00:00"; // Sale start ISO string (or set to null to start immediately)
const RELOAD_MIN_MS = 1000;          // Minimum refresh delay (ms)
const RELOAD_MAX_MS = 3500;          // Maximum refresh delay (ms)
const MAX_MINUTES = 3;               // Hard auto-stop limit in minutes
const CART_URL = "/cart";            // Cart path to redirect after successful add
// ------------------------------------
