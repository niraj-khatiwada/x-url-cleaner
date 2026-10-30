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

  function isPostURL(value) {
    if (typeof value !== "string" || /\s/.test(value)) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && hosts.has(url.hostname) &&
        !url.username && !url.password && !url.port && postPath.test(url.pathname);
    } catch {
      return false;
    }
  }

  function isSupportedSite(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && hosts.has(url.hostname) &&
        !url.username && !url.password && !url.port;
    } catch {
      return false;
    }
  }

  globalThis.XURLCleaner = Object.freeze({ cleanPostURL, isPostURL, isSupportedSite });
})();
