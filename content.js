(() => {
  "use strict";

  const hosts = new Set([
    "x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"
  ]);
  const postPath = /^\/(?:[a-zA-Z0-9_]+\/status|i\/web\/status)\/\d+(?:\/(?:photo|video)\/\d+)?\/?$/;

  function cleanPostURL(value) {
    // Only a standalone URL is eligible. Never rewrite prose or HTML.
    if (typeof value !== "string" || /\s/.test(value) || !value.includes("?")) {
      return value;
    }
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !hosts.has(url.hostname) ||
          url.username || url.password || url.port || !postPath.test(url.pathname)) {
        return value;
      }
      // Use the original string so casing, escaping, and media paths stay intact.
      const hashIndex = value.indexOf("#");
      const queryIndex = value.indexOf("?");
      if (hashIndex !== -1 && hashIndex < queryIndex) return value;
      return value.slice(0, queryIndex) + (hashIndex === -1 ? "" : value.slice(hashIndex));
    } catch {
      return value;
    }
  }

  function wrapMethod(prototype, name, makeWrapper) {
    if (!prototype) return;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    if (!descriptor || typeof descriptor.value !== "function") return;
    // Multiple injections must not stack wrappers.
    const marker = Symbol.for("x-url-cleaner.wrapped");
    if (descriptor.value[marker]) return;
    const replacement = makeWrapper(descriptor.value);
    Object.defineProperty(replacement, marker, { value: true });
    try {
      Object.defineProperty(prototype, name, { ...descriptor, value: replacement });
    } catch {
      // A locked-down API should not prevent the other copy path from working.
    }
  }

  wrapMethod(globalThis.Clipboard?.prototype, "writeText", (original) => function writeText(text) {
    const args = Array.from(arguments);
    if (args.length) args[0] = cleanPostURL(text);
    // Preserve the receiver, native promise, permission checks, and errors.
    return Reflect.apply(original, this, args);
  });

  // execCommand('copy') and other copy-event handlers use DataTransfer.setData.
  // Limit the fallback to copy-event clipboard objects, excluding drag-and-drop.
  const copyBuffers = new WeakSet();

  function selectedText() {
    // Libraries such as copy-to-clipboard can rely entirely on the browser's
    // default copy of a selected temporary element: no setData/writeText call.
    let active = globalThis.document?.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (active && ["TEXTAREA", "INPUT"].includes(active.tagName) &&
        typeof active.selectionStart === "number" && typeof active.selectionEnd === "number") {
      return active.value.slice(active.selectionStart, active.selectionEnd);
    }
    return globalThis.getSelection?.()?.toString() ?? "";
  }

  globalThis.addEventListener("copy", (event) => {
    if (!event.clipboardData) return;
    copyBuffers.add(event.clipboardData);
    const selection = selectedText();
    const cleaned = cleanPostURL(selection);
    if (cleaned !== selection) {
      event.clipboardData.setData("text/plain", cleaned);
      event.preventDefault();
    }
  }, true);

  wrapMethod(globalThis.DataTransfer?.prototype, "setData", (original) => function setData(format, data) {
    const args = Array.from(arguments);
    const normalizedFormat = typeof format === "string" ? format.toLowerCase() : "";
    if (copyBuffers.has(this) && ["text", "text/plain", "url", "text/uri-list"].includes(normalizedFormat)) {
      if (args.length >= 2) args[1] = cleanPostURL(data);
    }
    return Reflect.apply(original, this, args);
  });
})();
