# X URL Cleaner

A small Manifest V3 browser extension that removes the query string from X post links before they are copied. Keep using X's existing **Share → Copy link** menu. Chrome is live-tested; Firefox and Safari packages are prepared for browser testing.

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

## Clean a link manually

Click the extension's toolbar icon, paste an X or Twitter post URL, and click **Copy**. The cleaned URL appears immediately as you type or paste. Already-clean links can also be copied. Unsupported or malformed links show a message rather than silently changing the URL. If clipboard writing is blocked, the result is selected for manual copying with Command+C or Ctrl+C.

The popup works from any page and never reads your clipboard automatically or stores your links. Both the popup and automatic copying use the same URL-cleaning code in `cleaner.js`. Reload the extension after updating; for a Safari temporary install, re-add `dist/safari` if the popup does not appear.

## Firefox

Run `npm run build` (Node.js 18+ and the `zip` command). In Firefox 140 or newer, open `about:debugging`, select **This Firefox → Load Temporary Add-on**, and choose `dist/firefox/manifest.json` or `dist/x-url-cleaner-firefox-1.0.0.zip`. Reload X after allowing site access. Temporary installation lasts until Firefox restarts; permanent distribution requires Mozilla signing. The Firefox manifest declares no data collection.

See [Mozilla's installation instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) and [data collection manifest documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).

## Safari on macOS

The Xcode wrapper is at `safari/X URL Cleaner/X URL Cleaner.xcodeproj`. It targets macOS 15+ and Safari 18+. Run `npm run build` first; this also synchronizes the copied extension resources in the Xcode project. Open the project, select your signing team, and build/run the **X URL Cleaner** scheme. Then enable the extension in Safari settings, allow access to X, and reload X. Public distribution needs Apple signing and packaging. See [Apple's run instructions](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension).

The unsigned app can be compiled for verification without installing it:

```sh
xcodebuild -project 'safari/X URL Cleaner/X URL Cleaner.xcodeproj' \
  -scheme 'X URL Cleaner' -configuration Debug -derivedDataPath build/safari \
  CODE_SIGNING_ALLOWED=NO build
```

The local Safari packager warns about `content_scripts.world`, although [MDN's compatibility data](https://github.com/mdn/browser-compat-data/blob/main/webextensions/manifest/content_scripts.json) lists it as supported since Safari 18. The manifest retains `MAIN` because page API interception needs it. Verify this in Safari, along with the full copy-menu behavior, before release. The generated project is macOS-only; iOS has not been packaged or tested.

The unsigned macOS app compiled successfully with the locally installed Xcode toolchain. Firefox and Safari have not yet passed a live X copy-menu test; package checks and native compilation are not substitutes for that check.

The popup was rendered and exercised at its packaged extension URL in a disposable Chromium profile. Checks covered live input cleaning, layout, and the copy button with a stubbed clipboard. Native clipboard writing from the popup still needs a manual check in each browser; failure feedback and manual copying are covered by automated tests.

## Logo and packages

The master logo is `assets/logo.png`: scissors cutting a chain link, with no X glyph. `icons/` contains 16, 32, 48, and 128-pixel PNGs already wired into the manifest. Safari's native app icons use the same master. The built-in image generation prompt is recorded in `assets/README.md`.

`npm run build` generates browser folders and Chrome/Firefox ZIPs under `dist/`. Generated packages and Xcode build output are ignored by Git; project source and logo files are retained.

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
