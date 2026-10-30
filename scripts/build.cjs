// No dependencies: emit small browser packages from the same tested script.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const project = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (base.version !== project.version) throw new Error("manifest.json and package.json versions must match");
const packageFiles = ["manifest.json", "background.js", "cleaner.js", "content.js", "icons", "popup"];
for (const browser of ["chrome", "firefox", "safari"]) {
  const destination = path.join(root, "dist", browser);
  fs.rmSync(destination, { recursive: true, force: true });
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
  // The Safari ZIP is for temporary web-extension loading, not a signed app.
  const archive = path.join(root, "dist", `x-url-cleaner-${base.version}-${browser}.zip`);
  // Recreate archives to prevent zip from retaining stale entries.
  fs.rmSync(archive, { force: true });
  fs.rmSync(path.join(root, "dist", `x-url-cleaner-${browser}-${base.version}.zip`), { force: true });
  execFileSync("zip", ["-qr", archive, ...packageFiles], { cwd: destination });
  console.log(`Built ${browser}: ${path.relative(root, destination)}`);
}

// Keep Xcode's copied extension resources in sync with the browser package.
const safariResources = path.join(root, "safari", "X URL Cleaner", "X URL Cleaner Extension", "Resources");
if (fs.existsSync(safariResources)) {
  for (const file of ["manifest.json", "background.js", "cleaner.js", "content.js", "icons", "popup"]) {
    fs.cpSync(path.join(root, "dist", "safari", file), path.join(safariResources, file), { recursive: true });
  }
}
