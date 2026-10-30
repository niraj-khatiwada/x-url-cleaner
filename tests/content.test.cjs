const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "content.js"), "utf8");
const dirty = "https://x.com/Anc_Aesthetics/status/2115872968223941065?a=D8yU8po2mMl3FoLmAx0&s=20";
const clean = "https://x.com/Anc_Aesthetics/status/2115872968223941065";

function page({ failure, missingClipboard = false, lockedClipboard = false, url = "https://x.com/home" } = {}) {
  const calls = [];
  const listeners = [];
  const nativeResult = failure ? Promise.reject(failure) : Promise.resolve();
  // A failed-write test attaches its assertion after creating the page.
  nativeResult.catch(() => {});
  class Clipboard {
    writeText(...args) {
      if (!(this instanceof Clipboard)) throw new TypeError("Illegal invocation");
      calls.push(args);
      return nativeResult;
    }
  }
  class DataTransfer {
    constructor() { this.values = new Map(); }
    setData(format, value) { this.values.set(format, value); }
    getData(format) { return this.values.get(format) || ""; }
  }
  if (lockedClipboard) {
    Object.defineProperty(Clipboard.prototype, "writeText", { writable: false, configurable: false });
  }
  const context = vm.createContext({
    URL, location: { href: url }, Clipboard: missingClipboard ? undefined : Clipboard, DataTransfer,
    addEventListener: (...args) => listeners.push(args)
  });
  vm.runInContext(fs.readFileSync(path.join(root, "cleaner.js"), "utf8"), context);
  vm.runInContext(source, context);
  return {
    clipboard: new Clipboard(), buffer: new DataTransfer(), calls, nativeResult,
    context, listeners,
    copy(buffer) {
      const event = { clipboardData: buffer, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; } };
      for (const [name, listener, capture] of listeners) {
        assert.equal(name, "copy");
        assert.equal(capture, true);
        listener(event);
      }
      return event;
    }
  };
}

test("cleans the supplied example and preserves the original native promise", async () => {
  const p = page();
  assert.equal(p.clipboard.writeText(dirty), p.nativeResult);
  assert.deepEqual(p.calls, [[clean]]);
  await p.nativeResult;
});

test("cleans query variants, legacy hosts, and media paths; preserves fragments", () => {
  const p = page();
  const cases = [
    [clean + "?s=20&a=abc", clean],
    [clean + "?future_tracking=abc", clean],
    [clean + "?", clean],
    [clean + "?a=abc#reply", clean + "#reply"],
    [clean + "/photo/1?a=abc", clean + "/photo/1"],
    [clean + "/video/2?s=20", clean + "/video/2"],
    ["https://twitter.com/user/status/123?s=20", "https://twitter.com/user/status/123"],
    ["https://www.x.com/user/status/123?s=20", "https://www.x.com/user/status/123"],
    ["https://mobile.twitter.com/user/status/123?a=x", "https://mobile.twitter.com/user/status/123"],
    ["https://x.com/i/web/status/123?a=x", "https://x.com/i/web/status/123"],
    ["https://x.com/i/status/123?a=x", "https://x.com/i/status/123"],
    ["https://X.COM/user/status/123/?a=x", "https://X.COM/user/status/123/"]
  ];
  for (const [input, output] of cases) {
    p.clipboard.writeText(input);
    assert.equal(p.calls.at(-1)[0], output, input);
  }
});

test("does not alter unrelated, malformed, embedded, or already clean values", () => {
  const p = page();
  const values = [
    clean, "ordinary text", "not a URL?a=abc", "", null, undefined, 123,
    "https://example.com/user/status/123?a=x",
    "https://x.com.evil.example/user/status/123?a=x",
    "https://x.com@evil.example/user/status/123?a=x",
    "https://user:pass@x.com/user/status/123?a=x",
    "https://x.com:8443/user/status/123?a=x",
    "http://x.com/user/status/123?a=x",
    "https://x.com/search?q=example",
    "https://x.com/user?a=x",
    "https://x.com/user/status/not-a-number?a=x",
    "https://x.com/user/status/123/other?a=x",
    clean + "#fragment?keep=this",
    "Look at " + dirty, dirty + "\n", " " + dirty,
    dirty + "\n" + dirty, '<a href="' + dirty + '">post</a>'
  ];
  for (const value of values) {
    p.clipboard.writeText(value);
    assert.equal(p.calls.at(-1)[0], value, String(value));
  }
});

test("preserves native argument counts, receiver errors, and rejected writes", async () => {
  const failure = new Error("Clipboard permission denied");
  const p = page({ failure });
  await assert.rejects(p.clipboard.writeText(dirty), (error) => error === failure);
  p.clipboard.writeText();
  assert.equal(p.calls.at(-1).length, 0);
  p.clipboard.writeText(dirty, "extra argument");
  assert.deepEqual(p.calls.at(-1), [clean, "extra argument"]);
  assert.throws(() => p.clipboard.writeText.call({}, dirty), /Illegal invocation/);
});

test("cleans copy-handler text and URL formats, including after propagation stops", () => {
  const p = page();
  p.copy(p.buffer);
  // The capture listener already ran; no bubbling listener is required.
  for (const format of ["text/plain", "text", "url", "text/uri-list", "TEXT/PLAIN"]) {
    p.buffer.setData(format, dirty);
    assert.equal(p.buffer.getData(format), clean);
  }
  p.buffer.setData("text/plain", "Look at " + dirty);
  assert.equal(p.buffer.getData("text/plain"), "Look at " + dirty);
  p.buffer.setData("text/html", '<a href="' + dirty + '">post</a>');
  assert.equal(p.buffer.getData("text/html"), '<a href="' + dirty + '">post</a>');
});

test("does not rewrite drag-and-drop data or fail on a null copy buffer", () => {
  const p = page();
  p.copy(null);
  p.buffer.setData("text/plain", dirty);
  assert.equal(p.buffer.getData("text/plain"), dirty);
});

test("cleans the browser's default copy of a selected temporary textarea", () => {
  const p = page();
  p.context.document = { activeElement: {
    tagName: "TEXTAREA", value: "prefix " + dirty + " suffix",
    selectionStart: 7, selectionEnd: 7 + dirty.length
  } };
  const event = p.copy(p.buffer);
  assert.equal(event.defaultPrevented, true);
  assert.equal(p.buffer.getData("text/plain"), clean);
});

test("cleans default range selection copy, leaving ordinary selections alone", () => {
  const p = page();
  p.context.getSelection = () => ({ toString: () => dirty });
  assert.equal(p.copy(p.buffer).defaultPrevented, true);
  assert.equal(p.buffer.getData("text/plain"), clean);
  p.context.getSelection = () => ({ toString: () => "Read " + dirty });
  assert.equal(p.copy(p.buffer).defaultPrevented, false);
  p.context.getSelection = () => ({ toString: () => clean });
  assert.equal(p.copy(p.buffer).defaultPrevented, false);
});

test("copy fallback survives unavailable or locked Clipboard APIs", () => {
  for (const options of [{ missingClipboard: true }, { lockedClipboard: true }]) {
    const p = page(options);
    p.copy(p.buffer);
    p.buffer.setData("text/plain", dirty);
    assert.equal(p.buffer.getData("text/plain"), clean);
  }
});

test("re-injection does not stack method wrappers", () => {
  const p = page();
  const writeText = p.clipboard.writeText;
  const setData = p.buffer.setData;
  vm.runInContext(source, p.context);
  assert.equal(p.clipboard.writeText, writeText);
  assert.equal(p.buffer.setData, setData);
  p.clipboard.writeText(dirty);
  assert.deepEqual(p.calls, [[clean]]);
});

test("clipboard hooks never run on unrelated sites, lookalike hosts, or non-HTTPS pages", () => {
  for (const url of ["https://example.com/", "https://x.com.evil.example/", "http://x.com/", "about:blank"]) {
    const p = page({ url });
    assert.equal(p.listeners.length, 0, url);
    p.clipboard.writeText(dirty);
    assert.equal(p.calls[0][0], dirty, url);
  }
});

test("manifest loads the real script early in MAIN world with no API permissions", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.deepEqual(manifest.host_permissions, manifest.content_scripts[0].matches);
  assert.equal(manifest.content_scripts.length, 1);
  const script = manifest.content_scripts[0];
  assert.equal(script.world, "MAIN");
  assert.equal(script.run_at, "document_start");
  assert.deepEqual(script.matches, [
    "https://x.com/*", "https://www.x.com/*", "https://twitter.com/*",
    "https://www.twitter.com/*", "https://mobile.twitter.com/*"
  ]);
  for (const file of script.js) assert.ok(fs.existsSync(path.join(root, file)));
});
