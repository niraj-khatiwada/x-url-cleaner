const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const clean = "https://x.com/darshanpathak/status/2115998926549704912";
const dirty = clean + "?a=Nwt8ImL0dEzetv1W-RY&s=20";

function popup(writeText = async () => {}) {
  const elements = {};
  for (const id of ["link", "result", "copy", "status"]) {
    elements[id] = {
      value: "", textContent: "", disabled: id === "copy", dataset: {}, listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      setAttribute(key, value) { this[key] = value; },
      focus() { this.focused = true; }, select() { this.selected = true; }
    };
  }
  const context = vm.createContext({ URL,
    document: { getElementById: (id) => elements[id],
      createRange: () => ({ selectNodeContents(element) { this.element = element; } }) },
    getSelection: () => ({ removeAllRanges() {}, addRange(range) { range.element.selected = true; } }),
    navigator: { clipboard: { writeText } }
  });
  for (const file of ["cleaner.js", "popup/popup.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  }
  return { ...elements,
    input(value) { elements.link.value = value; elements.link.listeners.input(); },
    click() { return elements.copy.listeners.click(); }
  };
}

test("popup cleans a pasted URL immediately, trims whitespace, and copies the result", async () => {
  const writes = [];
  const p = popup(async (value) => writes.push(value));
  assert.equal(p.copy.disabled, true);
  p.input("  " + dirty + "\n");
  assert.equal(p.result.textContent, clean);
  assert.equal(p.copy.disabled, false);
  await p.click();
  assert.deepEqual(writes, [clean]);
  assert.equal(p.status.textContent, "Copied to clipboard.");
});

test("popup handles clean links, invalid links, and clearing without stale output", async () => {
  let writes = 0;
  const p = popup(async () => writes++);
  p.input(clean);
  assert.match(p.status.textContent, /Already clean/);
  assert.equal(p.copy.disabled, false);
  for (const value of ["https://example.com/?a=x", "https://x.com/search?q=test", "not a URL", ""]) {
    p.input(value);
    assert.equal(p.result.textContent, "");
    assert.equal(p.copy.disabled, true);
    await p.click();
  }
  assert.equal(writes, 0);
  assert.equal(p.status.textContent, "");
});

test("denied clipboard writes select the output and explain manual copying", async () => {
  const p = popup(async () => { throw new Error("Denied"); });
  p.input(dirty);
  await p.click();
  assert.equal(p.result.selected, true);
  assert.equal(p.result.focused, true);
  assert.match(p.status.textContent, /Copy unavailable/);
  assert.equal(p.status.dataset.error, "true");
});

test("a pending clipboard write cannot replace feedback for a newer input", async () => {
  let finish;
  const p = popup(() => new Promise(resolve => { finish = resolve; }));
  p.input(dirty);
  const copying = p.click();
  p.input("invalid");
  finish();
  await copying;
  assert.match(p.status.textContent, /valid X or Twitter/);
  assert.equal(p.copy.disabled, true);
});
