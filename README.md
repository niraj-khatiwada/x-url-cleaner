# X URL Cleaner

A small Manifest V3 Chrome extension that removes the query string from X post links before they are copied. Keep using X's existing **Share → Copy link** menu.

```text
Before: https://x.com/Anc_Aesthetics/status/2115872968223941065?a=D8yU8po2mMl3FoLmAx0&s=20
After:  https://x.com/Anc_Aesthetics/status/2115872968223941065
```

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder (`/Users/niraj/Documents/x-url-cleaner`).
4. Reload any open X tabs so the extension loads before X's scripts.
5. Use **Share → Copy link** on a post, then paste into a text editor to check the result.

No build or npm install is required. After changing the extension, click its **Reload** button on the extensions page and reload X again. Disable or remove it from the same page.

## Behavior and privacy

- Runs only on the X/Twitter domains listed in `manifest.json`.
- Cleans standalone HTTPS post URLs, including `/i/web/status/…`, `/i/status/…`, and photo/video post paths.
- Removes the entire query string, regardless of parameter names or order. Preserves the host, post path, and fragment.
- Leaves profile/search URLs, other websites, prose containing a URL, and HTML unchanged.
- Intercepts `Clipboard.writeText()`, text written by copy-event handlers, and the browser's default copy of a selected standalone post URL (including temporary textareas). Does not read the system clipboard, send network requests, store copied data, or require extra API permissions.
- Chrome may display a site-access warning because the extension runs on X/Twitter. Its script shares the page's JavaScript environment to intercept X's clipboard calls.

## Verification

Run `npm test` (Node.js 18 or newer). Tests exercise the actual content script in a simulated page environment, including native return values/errors, query variants, copy-event handling, unrelated data, and manifest scope.

An additional check passed in headless Brave (Chromium 156) using a disposable profile and a locally fulfilled `https://x.com` page: the unpacked extension loaded, the clipboard method was wrapped, copy-event text was cleaned, and drag data stayed unchanged. This check did not read or write the system clipboard or access the live X site.

Version 1.0.0 was also checked in a signed-in Brave browser using the live X **Share → Copy link** menu. Pasting the result confirmed that the copied post URL had no query parameters, including when X uses the browser's default copy of selected text.

Manual acceptance checks in Chrome:

1. Copy a link from the feed, an individual post, and a quoted post; paste each into a text editor and confirm the post URL has no query string.
2. Navigate to another post without reloading and repeat.
3. Copy a photo/video post link and confirm its media path is retained.
4. Copy regular text and a non-X URL; confirm they are unchanged.
5. Disable the extension, reload X, and confirm its original copy behavior returns.

## Limits

The automated tests simulate clipboard APIs; the live menu check is separate and does not cover every X view. Browser address-bar copying and the browser's **Copy link address** context menu do not call these page APIs and are outside this extension's scope. Rich `Clipboard.write()` payloads and native OS share sheets are not intercepted. If X changes its clipboard implementation or replaces these methods after startup, the extension may need an update.
