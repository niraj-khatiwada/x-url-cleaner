const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");

test("browser builds preserve script, scope, version, and valid icon dimensions", () => {
  const base = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  for (const browser of ["chrome", "firefox", "safari"]) {
    const directory = path.join(root, "dist", browser);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
    assert.equal(manifest.version, "1.0.0");
    assert.deepEqual(manifest.content_scripts, base.content_scripts);
    assert.equal(manifest.permissions, undefined);
    assert.deepEqual(manifest.host_permissions, base.content_scripts[0].matches);
    assert.equal(manifest.action.default_popup, "popup/popup.html");
    for (const file of ["background.js", "cleaner.js", "popup/popup.html", "popup/popup.js", "popup/popup.css"]) {
      assert.equal(fs.readFileSync(path.join(directory, file), "utf8"), fs.readFileSync(path.join(root, file), "utf8"));
    }
    assert.deepEqual(manifest.background, browser === "chrome" ?
      { service_worker: "background.js" } : { scripts: ["cleaner.js", "background.js"] });
    assert.equal(Object.hasOwn(manifest.background, "persistent"), false);
    assert.equal(fs.readFileSync(path.join(directory, "content.js"), "utf8"),
      fs.readFileSync(path.join(root, "content.js"), "utf8"));
    for (const [size, file] of Object.entries(manifest.icons)) {
      const png = fs.readFileSync(path.join(directory, file));
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.equal(png.readUInt32BE(16), Number(size));
      assert.equal(png.readUInt32BE(20), Number(size));
    }
    if (browser === "firefox") {
      assert.equal(manifest.minimum_chrome_version, undefined);
      assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, "140.0");
      assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ["none"]);
    }
    if (browser === "safari") {
      assert.equal(manifest.minimum_chrome_version, undefined);
      assert.equal(manifest.browser_specific_settings.safari.strict_min_version, "18.0");
    }
  }
});
