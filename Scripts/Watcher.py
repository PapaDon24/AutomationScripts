"""
crocs_cart.py - speeds up the repetitive part of a sale: open product page,
pick size, add to cart, jump to checkout. It STOPS before payment so you
review and confirm the purchase yourself.

Setup (once):
    pip install playwright
    playwright install chromium

First run (log in and save session):
    python crocs_cart.py --login

Sale time:
    python crocs_cart.py --start "2026-10-24 09:00"
"""

import argparse
import time
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

# ---------- EDIT THESE ----------
BASE_URL = "https://www.crocs.com"          # use your regional Crocs site
ITEMS = [
    # (product URL, size label exactly as shown on the page)
    ("https://www.crocs.com/p/classic-clog/10001.html", "M9"),
]
CART_URL = f"{BASE_URL}/cart"
PROFILE_DIR = Path.home() / ".crocs_profile"  # keeps you logged in between runs
# --------------------------------


def wait_until(start: str | None):
    if not start:
        return
    target = datetime.strptime(start, "%Y-%m-%d %H:%M")
    print(f"Waiting until {target} ...")
    while datetime.now() < target:
        time.sleep(0.2)


def add_item(page, url: str, size: str) -> bool:
    page.goto(url, wait_until="domcontentloaded")

    # Size selector. Role/text based locators survive layout changes better
    # than CSS classes. If this fails, inspect the page and adjust.
    try:
        page.get_by_role("button", name=size, exact=True).first.click(timeout=4000)
    except PWTimeout:
        try:
            page.get_by_text(size, exact=True).first.click(timeout=4000)
        except PWTimeout:
            print(f"[!] Could not find size '{size}' on {url} (sold out or selector changed)")
            return False

    # Add to cart button
    try:
        page.get_by_role("button", name="Add to Cart", exact=False).first.click(timeout=4000)
        page.wait_for_timeout(1000)
        print(f"[+] Added {url} ({size})")
        return True
    except PWTimeout:
        print(f"[!] Add to Cart button not found/clickable for {url}")
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--login", action="store_true", help="open browser to log in and save session")
    ap.add_argument("--start", help='sale start, local time: "YYYY-MM-DD HH:MM"')
    args = ap.parse_args()

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            str(PROFILE_DIR), headless=False, viewport={"width": 1280, "height": 900}
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        if args.login:
            page.goto(BASE_URL)
            input("Log in, save your address/payment in the account, then press Enter here...")
            ctx.close()
            return

        # Pre-load first product so the page is warm when the sale starts
        page.goto(ITEMS[0][0], wait_until="domcontentloaded")
        wait_until(args.start)

        for url, size in ITEMS:
            for attempt in range(1, 4):  # retry a few times in case of stock/page lag
                if add_item(page, url, size):
                    break
                print(f"    retry {attempt}/3")
                page.wait_for_timeout(500)

        page.goto(CART_URL, wait_until="domcontentloaded")
        print("\nCart is ready. Review it and complete payment yourself in the browser.")
        input("Press Enter to close the browser when done...")
        ctx.close()


if __name__ == "__main__":
    main()