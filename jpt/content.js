// content.js - injected into every page

(function () {
  const OVERLAY_ID = "jpt-translation-overlay";
  const SPINNER_STYLE_ID = "jpt-spinner-style";
  let outsideHandler = null; // reference to current outside-click handler
  let lastPopupPos = null; // {top,left}

  // --- Shift-hover selection variables ---
  let selectingShift = false;
  let anchorNode = null;
  let anchorOffset = 0;

  // Begin shift-selection
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift" && !selectingShift) {
      selectingShift = true;
      anchorNode = null;
      window.getSelection().removeAllRanges();
    }
  });

  // Update selection as mouse moves
  document.addEventListener("mousemove", (e) => {
    if (!selectingShift) return;
    const rangeAtPoint = document.caretRangeFromPoint
      ? document.caretRangeFromPoint(e.clientX, e.clientY)
      : null;
    if (!rangeAtPoint) return;

    if (!anchorNode) {
      anchorNode = rangeAtPoint.startContainer;
      anchorOffset = rangeAtPoint.startOffset;
    }

    const dynamicRange = document.createRange();
    dynamicRange.setStart(anchorNode, anchorOffset);
    dynamicRange.setEnd(rangeAtPoint.endContainer, rangeAtPoint.endOffset);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(dynamicRange);
  });

  // Finish selection on Shift release
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift" && selectingShift) {
      selectingShift = false;
      const text = window.getSelection().toString().trim();
      const selObj = window.getSelection();
      let rect = null;
      if (selObj.rangeCount > 0) {
        rect = selObj.getRangeAt(0).getBoundingClientRect();
      }
      if (text) {
        if (rect) {
          lastPopupPos = { top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX };
        }
        showLoadingOverlay();
        chrome.runtime.sendMessage({ action: "selectedText", text });
      }
      window.getSelection().removeAllRanges();
    }
  });

  // Build HTML: table without headers + translation paragraph
  function buildHtml(text) {
    if (!text) return "";
    const lines = text.trim().split(/\n+/);
    const rows = [];
    let translationLines = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by tab, any ideographic space, or two+ ascii spaces
      const parts = trimmed.split(/\t|\u3000| {2,}/).filter(Boolean);

      if (parts.length >= 2) {
        const jpCol = parts[0];
        const enCol = parts.slice(1).join(" ");
        rows.push([jpCol, enCol]);
      } else {
        translationLines.push(trimmed);
      }
    });

    let html = "<table class='jpt-table'><tbody>";
    rows.forEach((r) => {
      html += `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`;
    });
    html += "</tbody></table>";
    if (translationLines.length) {
      html += `<div class='jpt-translation'>${translationLines.join("<br>")}</div>`;
    }
    return html;
  }

  // Inject CSS once
  function ensureStyle() {
    if (document.getElementById("jpt-style")) return;
    const style = document.createElement("style");
    style.id = "jpt-style";
    style.textContent = `
      #${OVERLAY_ID} {
        position: absolute;
        background: #1e1e1e !important;
        border: 1px solid #555 !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        color: #f8f8f8 !important;
        font-family: sans-serif !important;
        font-size: 18px !important;
        line-height: 1.6 !important;
      }
      /* Specific styles for the compact loading box */
      #${OVERLAY_ID}.jpt-loading {
        min-width: 0 !important;
        max-width: none !important;
        width: auto !important;
        padding: 10px 14px !important; /* Give spinner some space */
        display: flex !important;
        align-items: center !important;
      }
      /* Specific styles for the wide results box */
      #${OVERLAY_ID}.jpt-loaded {
        max-width: 620px !important; /* allow to shrink below 480 */
      }
      #${OVERLAY_ID} table.jpt-table {
        width: auto !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        margin-bottom: 10px !important;
        border: 1px solid #888 !important;
      }
      #${OVERLAY_ID} td {
        padding: 4px 8px !important;
        white-space: nowrap !important;
        width: auto !important;
        vertical-align: top !important;
        border: 1px solid #888 !important;
      }
      #${OVERLAY_ID} .jpt-translation {
        margin-top: 6px !important;
        white-space: pre-wrap !important; /* Allow wrapping only for translation */
      }
    `;
    document.head.appendChild(style);
  }

  // Inject keyframes for spinner (once)
  function ensureSpinnerStyle() {
    if (document.getElementById(SPINNER_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SPINNER_STYLE_ID;
    style.textContent = `@keyframes jpt-spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
    document.head.appendChild(style);
  }

  // Show an overlay with a spinner while waiting for translation
  function showLoadingOverlay() {
    ensureStyle();
    ensureSpinnerStyle();

    // Remove existing overlay if any
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();

    // Determine position near selection or use previous or center
    let top, left;
    if (lastPopupPos) {
      ({ top, left } = lastPopupPos);
    } else {
      top = window.innerHeight / 2;
      left = window.innerWidth / 2;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        top = rect.bottom + window.scrollY + 8;
        left = rect.left + window.scrollX;
      }
    }

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "jpt-loading"; // Use class for styling
    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
    lastPopupPos = { top, left };

    const spinner = document.createElement("div");
    spinner.style.border = "4px solid #444";
    spinner.style.borderTop = "4px solid #fafafa";
    spinner.style.borderRadius = "50%";
    spinner.style.width = "24px";
    spinner.style.height = "24px";
    spinner.style.animation = "jpt-spin 1s linear infinite";

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
    attachOutsideClick();
  }

  function attachOutsideClick() {
    // Remove previous handler if exists
    if (outsideHandler) {
      document.removeEventListener("mousedown", outsideHandler, true);
    }

    outsideHandler = (ev) => {
      const overlay = document.getElementById(OVERLAY_ID);
      if (!overlay) {
        document.removeEventListener("mousedown", outsideHandler, true);
        outsideHandler = null;
        return;
      }
      if (!overlay.contains(ev.target)) {
        overlay.remove();
        document.removeEventListener("mousedown", outsideHandler, true);
        outsideHandler = null;
      }
    };

    document.addEventListener("mousedown", outsideHandler, true);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "translate") {
      handleTranslateRequest();
    } else if (message.action === "displayTranslation") {
      showOverlay(message.translation);
    }
    // We don't need sendResponse here
  });

  /**
   * Handles request to grab selected text and forward it to the background script.
   */
  function handleTranslateRequest() {
    // Show spinner immediately
    showLoadingOverlay();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      chrome.runtime.sendMessage({ action: "selectedText", text: "" });
      return;
    }

    const text = selection.toString();
    chrome.runtime.sendMessage({ action: "selectedText", text });
  }

  /**
   * Creates or updates the translation overlay near the current selection.
   * @param {string} content Translation text to display
   */
  function showOverlay(content) {
    ensureStyle();
    // Remove existing overlay if any
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();

    // Use stored popup position if available, else compute
    let top, left;
    if (lastPopupPos) {
      ({ top, left } = lastPopupPos);
    } else {
      top = window.innerHeight / 2;
      left = window.innerWidth / 2;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        top = rect.bottom + window.scrollY + 8;
        left = rect.left + window.scrollX;
      }
    }

    // Create overlay element
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "jpt-loaded"; // Use class for styling
    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
    lastPopupPos = { top, left };

    // Content container
    const textEl = document.createElement("div");
    textEl.innerHTML = buildHtml(content);

    overlay.appendChild(textEl);

    document.body.appendChild(overlay);
    attachOutsideClick();
    enableDrag(overlay);
  }

  /** Makes the overlay draggable */
  function enableDrag(el) {
    el.style.cursor = "default";
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    function onMouseDown(ev) {
      if (ev.button !== 2) return; // right click
      dragOffsetX = ev.clientX - parseInt(el.style.left, 10);
      dragOffsetY = ev.clientY - parseInt(el.style.top, 10);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp, { once: true });
      ev.preventDefault();
    }
    function onMove(ev) {
      const newLeft = ev.clientX - dragOffsetX;
      const newTop = ev.clientY - dragOffsetY;
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      lastPopupPos = { top: newTop, left: newLeft };
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
    }
    el.addEventListener("mousedown", onMouseDown);
    // Prevent default context menu on right-click drag start
    el.addEventListener("contextmenu", (e) => {
      if (document.body.contains(el)) e.preventDefault();
    });
  }
})(); 