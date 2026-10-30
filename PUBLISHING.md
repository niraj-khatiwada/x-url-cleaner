# Publishing X URL Cleaner

Submission guide checked October 30, 2026. Follow the current dashboard prompts if labels or requirements change. No store upload, account enrollment, payment, or public release has been performed by this project.

## Prepare the release

1. Run `npm test`. It builds all browser packages and runs the automated checks. No npm dependencies need installing.
2. Test the popup's actual **Copy** button and X's **Share → Copy link** menu in each browser you intend to publish for. Also test switching tabs, a faded icon on unrelated sites, and ordinary copied text. The Chromium checks and unsigned Safari build do not establish that every browser's native clipboard behavior works.
3. Keep version `1.0.0` for this initial release. Before later uploads, increase `manifest.json` and `package.json` versions together, adjust the version expectation in `tests/packages.test.cjs`, update Safari's marketing/build versions as appropriate, and rebuild.
4. Prepare the blue/black logo, accurate screenshots of the current UI, a description, a support URL/email, and a publicly accessible privacy-policy URL. `PRIVACY.md` contains the current on-device behavior statement; publish it somewhere accessible, or use its GitHub page after this commit is pushed and the repository is public. Test the URL while signed out.
5. Choose your code/distribution license before completing any store license field. This repository does not currently include a LICENSE file; no license has been chosen for you.
6. Keep browser packages distinct. Upload only the generated browser ZIP, not a ZIP of the whole repository (which contains other manifests, tests, and the Xcode project).

Packages:

| Browser | Upload / source |
| --- | --- |
| Chrome | `dist/x-url-cleaner-chrome-1.0.0.zip` |
| Firefox | `dist/x-url-cleaner-firefox-1.0.0.zip` |
| Safari | `safari/X URL Cleaner/X URL Cleaner.xcodeproj` for Xcode signing and archiving |

## Chrome Web Store

1. Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) with the Google account you want to own the listing.
2. Register as a developer, accept the developer terms, pay the one-time registration fee shown, complete the requested publisher/contact verification, and enable Google two-step verification. [Registration](https://developer.chrome.com/docs/webstore/register/), [two-step verification](https://developer.chrome.com/blog/policy-update-2sv).
3. Click **Add new item** and upload `dist/x-url-cleaner-chrome-1.0.0.zip`. Resolve any package validation errors before continuing.
4. Complete **Store listing**: describe automatic X/Twitter post-link cleaning and the manual paste-and-copy popup, choose a fitting category and language, and add support information. Upload `icons/icon-128.png` as the icon and at least one accurate 1280×800 screenshot. Optional promo tiles are 440×280 and 1400×560. [Listing requirements](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).
5. Complete **Privacy practices**. Suggested single purpose: “Remove query parameters from X/Twitter post URLs when copying or manually pasting a link.” Explain that the X/Twitter host access enables copy interception and recognizing supported tabs for the toolbar indicator. Declare no remote executable code. Accurately state that links are processed locally without collection/transmission, and provide the privacy URL when requested. [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
6. Complete **Distribution**, including visibility and supported countries/regions. Supply any required publisher/trader disclosures using your actual circumstances.
7. Add reviewer test instructions. The popup can be tested without logging into X: paste a tracked example, click **Copy**, and paste it into an editor. Explain separately that testing X's native share menu requires an X session. Never provide your personal credentials.
8. Click **Submit for review**, then choose automatic publication after approval or deferred/manual publishing. Monitor dashboard messages and email. If changes are requested, fix them and submit an increased version as needed. [Official publishing flow](https://developer.chrome.com/docs/webstore/publish).

## Firefox Add-ons (AMO)

1. Sign in or create a Mozilla Account at the [Add-ons Developer Hub](https://addons.mozilla.org/developers/). Complete the developer agreement and account requirements presented.
2. Choose **Submit a New Add-on**, then **On this site** for a public AMO listing. **On your own** is the separate signed self-distribution option.
3. Upload `dist/x-url-cleaner-firefox-1.0.0.zip`. Do not upload the Chrome ZIP: Firefox uses background scripts instead of the Chrome service worker.
4. Review validator output and resolve errors. The Firefox build already supplies an extension ID, a minimum Firefox version of 140, and a no-data-collection declaration. Keep its ID stable once published.
5. Choose only platforms you have tested. Do not claim Firefox Android support based only on desktop testing.
6. Answer the source-code question accurately. The ZIP contains readable, unminified JavaScript, with no compiled JavaScript dependency bundle. If Mozilla requests additional source/build material, provide it and the `npm run build` instructions. See [source-code submission](https://extensionworkshop.com/documentation/publish/source-code-submission/).
7. Fill in the name, unique AMO slug, summary, full description, category, support information, license, icon/screenshots, privacy information, and reviewer notes. Disclose that the extension processes links locally and declares no data collection. Use a license you have selected, rather than assuming that a public repository grants a license.
8. Click **Submit Version** and follow the dashboard's signing/publication status and any reviewer requests. A temporary local installation does not replace signing for normal Firefox users. [Official submission steps](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).
9. Once listed, install the published version in a clean Firefox profile and recheck copying, site permissions, and toolbar behavior. Submit future versions through the existing add-on's page.

## Safari / Mac App Store

### Account requirement

Yes: public App Store distribution requires the paid **Apple Developer Program**, currently **US$99 per membership year**, with regional pricing and eligible fee waivers. A free Apple Account is not a substitute for distribution membership. Local temporary folder testing does not require paid membership. [Enrollment](https://developer.apple.com/programs/enroll/), [Safari distribution](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).

### Upload with the existing Xcode project

1. Enroll at [Apple Developer](https://developer.apple.com/programs/enroll/) and complete Apple's identity/account requirements. Sign into [App Store Connect](https://appstoreconnect.apple.com/).
2. Run `npm run build` to synchronize the latest extension resources into the Safari project. Open `safari/X URL Cleaner/X URL Cleaner.xcodeproj` in Xcode.
3. Add your Apple Account to Xcode settings. Select your paid development team under **Signing & Capabilities** for both the containing app and the extension targets, and resolve signing issues. Use stable identifiers you control: the current app is `com.niraj.x-url-cleaner` and the extension is `com.niraj.x-url-cleaner.Extension`. Change them before first registration if your developer account requires different identifiers; update the identifier in `ViewController.swift` too if you change it.
4. Confirm both targets' release version/build numbers, macOS deployment requirements, icons, and app metadata. This project is macOS-only; it does not yet produce an iPhone/iPad release.
5. Build and run the signed app. Enable its extension in Safari, grant only the supported-site access, and perform the live copy tests. Investigate the converter's `world` warning noted in the README if page hooks do not work. Do not treat a successful native compilation as proof of runtime compatibility.
6. In **App Store Connect → Apps → + → New App**, create a **macOS** record. Enter the app name, primary language, the containing app's matching registered bundle ID, a private SKU of your choice, and any requested access settings.
7. In Xcode select the containing **X URL Cleaner** app scheme and a Mac destination, then choose **Product → Archive**. In Organizer choose **Distribute App → App Store Connect**, validate, and upload. Use signing for distribution; do not upload the unsigned app from local compile checks.
8. Wait for build processing in App Store Connect. Complete the app description, categories, screenshots, support URL, privacy-policy URL, age-rating questionnaire, App Privacy answers, distribution/pricing/availability, and any export-compliance questions applicable to the app. Choose “Data Not Collected” only while the code and all included components match that statement.
9. Optionally distribute a build with TestFlight for real-user testing. Complete any beta review requirements presented.
10. Select the processed build for the initial App Store version. Add reviewer instructions for enabling the Safari extension, granting site access, and testing the no-login popup. Select your release timing and submit for App Review. Address review feedback and release after approval. [Apple's Safari distribution guide](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).

Apple also provides a [web-based Safari Extension Packager in App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect) as an alternative to the Xcode upload route. It also requires paid program enrollment. The steps above use the macOS wrapper already in this repository.

## Listing text you can adapt

**Summary:** Copy clean X and Twitter post links, without query parameters.

**Description:** X URL Cleaner removes query parameters from X and Twitter post URLs. Use Share → Copy link on X, or paste a post link into the extension popup and copy the clean result. The toolbar icon fades on other sites to indicate automatic cleaning is inactive. Link processing stays on your device; the extension has no analytics, accounts, or remote backend. The popup accepts X/Twitter post links, rather than arbitrary website URLs. This is an independent extension and is not affiliated with X Corp.

**Reviewer popup example:**

```text
Input:    https://x.com/example/status/123456789?a=example&s=20
Expected: https://x.com/example/status/123456789
```

This syntactic example tests the popup without requiring the example post to exist. Testing the share menu requires an actual accessible post.
