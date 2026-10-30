// No dependencies: emit small browser packages from the same tested script.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
for (const browser of ["chrome", "firefox", "safari"]) {
  const destination = path.join(root, "dist", browser);
  fs.mkdirSync(destination, { recursive: true });
  const manifest = structuredClone(base);
  if (browser !== "chrome") delete manifest.minimum_chrome_version;
  if (browser !== "chrome") {
    // Manifest V3 event pages are nonpersistent by default; Firefox warns if
    // the legacy `persistent` property is included, even when set to false.
    manifest.background = { scripts: ["cleaner.js", "background.js"] };
  }
  if (browser === "firefox") {
    manifest.browser_specific_settings = {
      gecko: {
        id: "x-url-cleaner@extensions.local",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] }
      }
    };
  }
  if (browser === "safari") {
    manifest.browser_specific_settings = { safari: { strict_min_version: "18.0" } };
  }
  fs.writeFileSync(path.join(destination, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const file of ["background.js", "cleaner.js", "content.js", "icons", "popup"]) {
    fs.cpSync(path.join(root, file), path.join(destination, file), { recursive: true });
  }
  // Safari is packaged through Xcode rather than as a ZIP.
  if (browser !== "safari") {
    const archive = path.join(root, "dist", `x-url-cleaner-${browser}-${base.version}.zip`);
    // Remove the previous generated archive so zip cannot retain stale entries.
    fs.rmSync(archive, { force: true });
    execFileSync("zip", ["-qr", archive, "manifest.json", "background.js", "cleaner.js", "content.js", "icons", "popup"], { cwd: destination });
  }
  console.log(`Built ${browser}: ${path.relative(root, destination)}`);
}

// Keep Xcode's copied extension resources in sync with the browser package.
const safariResources = path.join(root, "safari", "X URL Cleaner", "X URL Cleaner Extension", "Resources");
if (fs.existsSync(safariResources)) {
  for (const file of ["manifest.json", "background.js", "cleaner.js", "content.js", "icons", "popup"]) {
    fs.cpSync(path.join(root, "dist", "safari", file), path.join(safariResources, file), { recursive: true });
  }
}
