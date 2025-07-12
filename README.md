# JPT – Japanese Quick-Translate Chrome Extension

This repository contains an unpacked Chrome extension (named **JPT**) that gives you fast, on-page help while reading Japanese.

---

## Features

* **Shift-Select translation** – Hold <kbd>Shift</kbd>, drag the mouse over any Japanese text, release <kbd>Shift</kbd> ➜ a popup appears with:
  * Word-by-word table + full sentence translation (for phrases / sentences)
  * Conjugation-breakdown table (for a single inflected word)
* **Dark floating popup** – Draggable with **right-click drag** so left-click keeps text selectable.
* Uses **OpenAI gpt-4o** (or your preferred model) via your own API key.

---

## Installation

1. Clone or download this repo.
2. Open Chrome and visit `chrome://extensions/`.
3. Turn on **Developer mode** (toggle top-right).
4. Click **Load unpacked** and select the `jpt` folder.
5. The extension icon will appear in the toolbar.

> **Updating** – After pulling new changes just hit **Reload** on the extension card.

---

## First-time Setup – Add your OpenAI API key

1. Right-click the extension icon → **Options** (or click **Details → Extension options**).
2. Paste your `sk-...` API key and **Save**.
   * The key is stored locally in `chrome.storage.local` only.

---

## Usage

### A) Shift-drag (recommended)

1. Hold <kbd>Shift</kbd>.
2. Drag across text you want to translate.
3. Release <kbd>Shift</kbd> – a spinner pops up just below the selection; a moment later the result appears.
4. **Right-click and drag** the popup to move it; left-click still lets you select / copy table text.
5. Click anywhere outside the popup to dismiss it.

*(You can assign your own keyboard shortcut in Chrome’s **Keyboard shortcuts** page if desired.)*

---

## Output formats

| When you select… | Popup shows… |
| --- | --- |
| **Phrase / sentence** | Word-by-word table (JP \| EN) + blank line + full translation |
| **Single inflected word** | Conjugation table from dictionary form to original word |

All tables are plain text (no Markdown) with tabular layout and thin borders.

---

## Privacy & Security

* Only the highlighted text and your API key are sent to the OpenAI API.
* No data is stored or transmitted elsewhere.

---

## Customisation

* **Model** – edit `jpt/background.js` (`model: "gpt-4o"`).
* **Prompt** – same file; adjust the system prompt to your liking.
* **Shortcut** – change in Chrome → **Extensions → Keyboard shortcuts**.
* **Styling** – tweak the dark-theme CSS inside `jpt/content.js`.

---

## License

MIT – see `LICENSE` in the `jpt` folder.