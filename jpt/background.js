// background.js - Chrome Extension Service Worker

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-translate") {
    // Get the currently active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      // Ask the content script in that tab to collect the selected text
      chrome.tabs.sendMessage(tab.id, { action: "translate" });
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.action !== "selectedText") {
    return; // Not our message
  }

  const { text } = message;

  if (!text || !text.trim()) {
    // No text selected; tell content script to show a brief notice
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "displayTranslation",
      translation: "No text selected. Please highlight Japanese text first."
    });
    return;
  }

  // Fetch the OpenAI API key from storage
  chrome.storage.local.get(["apiKey"], async (res) => {
    const apiKey = res.apiKey;

    if (!apiKey) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "displayTranslation",
        translation: "⚠️ Please set your OpenAI API key in the extension options."
      });
      return;
    }

    try {
      // Call the OpenAI chat completion endpoint
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a Japanese language teacher assisting English-speaking learners via this Chrome extension. The user has highlighted Japanese text. Decide which of the following two OUTPUT FORMATS to produce, based on the selection: \n\n1) If the selection is a SINGLE INFLECTED WORD (no spaces, up to ~8 characters) – Provide a conjugation breakdown table. First row = dictionary/plain form, intermediate rows = conjugations applied in order, last row = the original word. Each row format: JAPANESE_FORM<TAB>ENGLISH_DESCRIPTION (no headers, TAB between columns). ENGLISH_DESCRIPTION must be pure English (no Japanese characters or kana). Do NOT add any full-sentence translation.\n\n2) Otherwise (phrase, sentence, or multiple tokens) – Provide a word-by-word breakdown. Skip standalone punctuation. Each line: JAPANESE_COLUMN<TAB>ENGLISH_MEANING (no headers, TAB between columns; ENGLISH_MEANING must be pure English, no Japanese characters). In JAPANESE_COLUMN, if the word contains kanji include hiragana in parentheses like 忘れる (わすれる); if it's pure kana just show the kana. After the table lines, add a blank line and then the full English translation of the entire selection on its own line.\n\nDo NOT output anything other than the specified table (and translation line for case 2). No markdown, no extra commentary."
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const translation =
        data.choices?.[0]?.message?.content?.trim() ||
        "⚠️ Failed to get a translation.";

      // Send the translation back to the content script to display
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "displayTranslation",
        translation
      });
    } catch (err) {
      console.error("Translation error", err);
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "displayTranslation",
        translation: `⚠️ Translation failed: ${err.message}`
      });
    }
  });

  // Indicate that we'll respond asynchronously (even though we use tabs.sendMessage)
  return true;
}); 