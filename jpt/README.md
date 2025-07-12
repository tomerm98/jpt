
## Chrome Extension – Japanese Word-by-Word Translator

### Installation

1. Build or download the extension source (this folder).
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `jpt` folder.
5. The extension should now appear in your toolbar.

### Setting your OpenAI API key

1. Right-click the extension icon and choose **Options** (or click the *Details* button and then **Extension options**).
2. Paste your `sk-...` key in the field and press **Save**.
   • The key is stored only in `chrome.storage.local` on your machine.

### Usage

1. On any web page, highlight Japanese text you want to analyse.
2. Press **Alt + Shift + J** (Command ⌘ + Option + J on macOS if you adjust shortcuts in Chrome settings).
3. A small popup appears near your selection, showing a word-by-word breakdown courtesy of GPT-4o.
4. Click the **×** button to dismiss the popup.

### Security & Privacy

• The selected text and your API key are sent **only** to OpenAI’s API endpoint.
• No other data is collected or transmitted.

### Customisation

You can edit `background.js` to adjust the prompt, temperature, or model name (e.g.
`gpt-4o`). Keyboard shortcuts can be changed in Chrome’s **Extensions → Keyboard
shortcuts** panel. 