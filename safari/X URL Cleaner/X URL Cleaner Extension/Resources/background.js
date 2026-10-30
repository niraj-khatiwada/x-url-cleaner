(() => {
  "use strict";
  // Chrome uses a worker; Firefox/Safari packages load cleaner.js first in an
  // event page. No remote requests, clipboard access, or page injection here.
  if (!globalThis.XURLCleaner) importScripts("cleaner.js");
  const api = globalThis.browser ?? globalThis.chrome;
  const activeIcons = { 16: "icons/icon-16.png", 32: "icons/icon-32.png" };
  const revisions = new Map();
  let mutedIcons;

  function getMutedIcons() {
    if (!mutedIcons) mutedIcons = Promise.all(Object.entries(activeIcons).map(async ([size, path]) => {
      const response = await fetch(api.runtime.getURL(path));
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = new OffscreenCanvas(Number(size), Number(size));
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0, Number(size), Number(size));
      bitmap.close();
      const image = context.getImageData(0, 0, Number(size), Number(size));
      for (let i = 0; i < image.data.length; i += 4) {
        const gray = Math.round(image.data[i] * .2126 + image.data[i + 1] * .7152 + image.data[i + 2] * .0722);
        image.data[i] = image.data[i + 1] = image.data[i + 2] = gray;
        image.data[i + 3] = Math.round(image.data[i + 3] * .35);
      }
      return [size, image];
    })).then(Object.fromEntries);
    return mutedIcons;
  }

  async function updateTab(tabId) {
    const revision = (revisions.get(tabId) ?? 0) + 1;
    revisions.set(tabId, revision);
    try {
      const inactive = await getMutedIcons();
      const tab = await api.tabs.get(tabId);
      if (revisions.get(tabId) !== revision) return;
      // Only the allowlisted host permissions expose a tab URL; all others
      // default to inactive. We do not request broad tabs or all-sites access.
      const active = globalThis.XURLCleaner.isSupportedSite(tab.url);
      await Promise.all([
        api.action.setIcon(active ? { tabId, path: activeIcons } : { tabId, imageData: inactive }),
        api.action.setTitle({ tabId, title: active ? "X URL Cleaner — automatic cleaning active" :
          "X URL Cleaner — automatic cleaning inactive here; paste a link to clean it" })
      ]);
    } catch {
      // A tab may close or become inaccessible while an update is in flight.
    }
  }

  async function refreshAll() {
    const tabs = await api.tabs.query({});
    await Promise.all(tabs.map(tab => updateTab(tab.id)));
  }
  api.tabs.onActivated.addListener(({ tabId }) => { void updateTab(tabId); });
  api.tabs.onUpdated.addListener((tabId, change) => {
    if (change.url || change.status) void updateTab(tabId);
  });
  api.tabs.onRemoved.addListener(tabId => revisions.delete(tabId));
  api.runtime.onInstalled.addListener(() => { void refreshAll().catch(() => {}); });
  api.runtime.onStartup.addListener(() => { void refreshAll().catch(() => {}); });
  // Reapply state to existing tabs whenever the nonpersistent background wakes.
  void (async () => {
    await api.action.setIcon({ imageData: await getMutedIcons() });
    await refreshAll();
  })().catch(() => {});
})();
