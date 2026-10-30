(() => {
  "use strict";
  const { cleanPostURL, isPostURL } = globalThis.XURLCleaner;
  const input = document.getElementById("link");
  const output = document.getElementById("result");
  const copy = document.getElementById("copy");
  const status = document.getElementById("status");

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }

  input.addEventListener("input", () => {
    const value = input.value.trim();
    const valid = isPostURL(value);
    output.textContent = valid ? cleanPostURL(value) : "";
    copy.disabled = !valid;
    input.setAttribute("aria-invalid", String(Boolean(value) && !valid));
    message(!value ? "" : !valid ? "Paste a valid X or Twitter post link." :
      output.textContent === value ? "Already clean. Ready to copy." : "Parameters removed. Ready to copy.", Boolean(value) && !valid);
  });

  copy.addEventListener("click", async () => {
    const value = output.textContent;
    if (!value || copy.disabled) return;
    try {
      // Call directly from the click to retain user activation across browsers.
      await navigator.clipboard.writeText(value);
      if (output.textContent === value) message("Copied to clipboard.");
    } catch {
      // Retain a selectable result if clipboard writing is unavailable or denied.
      // No clipboard reading or additional permissions are needed.
      if (output.textContent !== value) return;
      output.focus();
      const range = document.createRange();
      range.selectNodeContents(output);
      const selection = globalThis.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      message("Copy unavailable. The clean URL is selected; press ⌘C or Ctrl+C.", true);
    }
  });
})();
