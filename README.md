<p align="center">
  <img src="assets/logo.png" alt="X URL Cleaner logo: blue chain link being cut by scissors" width="160" height="160">
</p>

# X URL Cleaner

## Install locally

Follow the setup below once, then use the installation steps for your browser: [Chrome / Brave](#chrome--brave), [Firefox](#firefox-140-or-newer), or [Safari](#safari-on-macos-temporary-folder-installation).

### Download and build the browser packages

Install Node.js 18 or newer and make sure the `zip` command is available. Then run:

```sh
git clone https://github.com/niraj-khatiwada/x-url-cleaner.git
cd x-url-cleaner
npm run build
```

If you already have the project, run `npm run build` inside it. No `npm install` is needed: the project has no npm dependencies. Browser-specific folders and ZIPs are generated in `dist/`.

### Chrome / Brave

1. Open `chrome://extensions` (or `brave://extensions` in Brave).
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the **`dist/chrome` folder**. Select the folder itself, not its manifest file.
5. Pin **X URL Cleaner** in the browser's extensions menu if you want it visible in the toolbar.
6. Open or reload X/Twitter and allow site access if prompted.
7. Click the toolbar icon to try the manual cleaner, or use X's **Share → Copy link** menu and paste the result into a text editor.

After updating: rebuild, click **Reload** on the extension card, and reload X/Twitter tabs.

### Firefox (140 or newer)

1. Open `about:debugging`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on…**.
4. Open the **`dist/firefox` folder and select `manifest.json`**. Alternatively, select `dist/x-url-cleaner-firefox-1.0.0.zip` directly.
5. Use the Firefox build: the repository-root manifest and `dist/chrome` manifest are for Chrome and will report a background-service-worker error in Firefox.
6. Allow access to X/Twitter if Firefox asks, then open or reload the site.
7. Click the toolbar icon to try the popup, and test **Share → Copy link** on X.

Temporary add-ons are removed when Firefox restarts. After source changes, rebuild and click **Reload** in `about:debugging` if you loaded the manifest. If you loaded the ZIP, remove and re-add the rebuilt ZIP. A permanent installation requires a Mozilla-signed release.

[Mozilla's temporary installation instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

### Safari on macOS (temporary folder installation)

These steps use a recent Safari version with **Add Temporary Extension…**. No paid Apple Developer membership or Xcode project is needed for this local test.

1. Open **Safari → Settings → Advanced**.
2. Enable **Show features for web developers** if the Developer settings tab is not already visible.
3. Open **Settings → Developer** and click **Add Temporary Extension…**.
4. Approve the unsigned-extension prompt for this locally built extension.
5. Select the **`dist/safari` folder**, not the Chrome folder or a manifest file. In the file picker, press **Command+Shift+G** to enter its full path if needed.
6. Open **Settings → Extensions**, enable **X URL Cleaner**, and allow access to X/Twitter. If you use Safari profiles, enable it for the profile you are testing.
7. Open or reload X/Twitter. Test the toolbar popup and **Share → Copy link**, then paste into a text editor.

After source changes, rebuild and reload the temporary extension using Safari's developer controls, or remove and re-add `dist/safari`. Safari may require allowing unsigned extensions again after restarting. If your Safari does not offer folder installation, use the Xcode project instructions below.

[Apple's local testing instructions](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension).

## About

A small Manifest V3 browser extension that removes the query string from X post links before they are copied. Keep using X's existing **Share → Copy link** menu. Chrome is live-tested; Firefox and Safari packages are prepared for browser testing.

```text
Before: https://x.com/Anc_Aesthetics/status/2115872968223941065?a=D8yU8po2mMl3FoLmAx0&s=20
After:  https://x.com/Anc_Aesthetics/status/2115872968223941065
```

## Clean a link manually

Click the extension's toolbar icon, paste an X or Twitter post URL, and click **Copy**. The cleaned URL appears immediately as you type or paste. Already-clean links can also be copied. Unsupported or malformed links show a message rather than silently changing the URL. If clipboard writing is blocked, the result is selected for manual copying with Command+C or Ctrl+C.

The popup works from any page and never reads your clipboard automatically or stores your links. Both the popup and automatic copying use the same URL-cleaning code in `cleaner.js`. Reload the extension after updating; for a Safari temporary install, re-add `dist/safari` if the popup does not appear.

The toolbar icon is full color on supported HTTPS X/Twitter pages and fades to grayscale on other sites. Its tooltip explains whether automatic cleaning is active. The popup remains available for manually cleaning a pasted post link from any page.

Automatic clipboard hooks are limited by both manifest match patterns and a runtime hostname check. The background script only updates toolbar state; it does not access the clipboard or inject into pages. Host permissions are restricted to the same X/Twitter hosts so supported tab URLs can be recognized without requesting the broad `tabs` permission. Other tab URLs are treated as inactive when unavailable.

## Safari Xcode project (optional)

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

## Publishing

See [PUBLISHING.md](PUBLISHING.md) for Chrome Web Store, Firefox Add-ons, and Safari App Store submission steps. See [PRIVACY.md](PRIVACY.md) for the extension privacy statement.
