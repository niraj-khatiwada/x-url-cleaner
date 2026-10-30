const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const tick = () => new Promise(resolve => setImmediate(resolve));

test("toolbar is colored only on supported sites and muted on unrelated or inaccessible tabs", async () => {
  const icons = new Map(), titles = new Map(), listeners = {};
  const tabs = new Map([[1, { id: 1, url: "https://x.com/home" }],
    [2, { id: 2, url: "https://example.com/" }], [3, { id: 3 }]]);
  const event = name => ({ addListener(fn) { listeners[name] = fn; } });
  class Canvas {
    getContext() { return { drawImage() {}, getImageData() {
      return { data: new Uint8ClampedArray([80, 220, 120, 255]) };
    } }; }
  }
  const api = {
    runtime: { getURL: path => "chrome-extension://test/" + path,
      onInstalled: event("install"), onStartup: event("startup") },
    tabs: { query: async () => [...tabs.values()], get: async id => {
      if (!tabs.has(id)) throw new Error("Closed tab");
      return tabs.get(id);
    }, onActivated: event("activate"), onUpdated: event("update"), onRemoved: event("remove") },
    action: { setIcon: async options => icons.set(options.tabId, options),
      setTitle: async options => titles.set(options.tabId, options.title) }
  };
  const context = vm.createContext({ URL, browser: api, OffscreenCanvas: Canvas,
    fetch: async url => {
      assert.match(url, /^chrome-extension:\/\/test\/icons\//);
      return { blob: async () => ({}) };
    }, createImageBitmap: async () => ({ close() {} }) });
  for (const file of ["cleaner.js", "background.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  await tick();
  assert.equal(icons.get(1).path[16], "icons/icon-16.png");
  for (const id of [2, 3]) {
    const pixel = icons.get(id).imageData[16].data;
    assert.equal(pixel[0], pixel[1]);
    assert.equal(pixel[1], pixel[2]);
    assert.equal(pixel[3], 89);
    assert.match(titles.get(id), /inactive/);
  }
  tabs.set(1, { id: 1 });
  listeners.update(1, { status: "loading" });
  await tick();
  assert.ok(icons.get(1).imageData);
  tabs.set(2, { id: 2, url: "https://twitter.com/home" });
  listeners.activate({ tabId: 2 });
  await tick();
  assert.ok(icons.get(2).path);
  assert.match(titles.get(2), /automatic cleaning active/);
  tabs.delete(2);
  listeners.remove(2);
  listeners.activate({ tabId: 2 });
  await tick();
});
