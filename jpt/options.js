// options.js – handles saving/loading the API key

document.addEventListener("DOMContentLoaded", init);

function init() {
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusEl = document.getElementById("status");

  // Load saved key
  chrome.storage.local.get(["apiKey"], (res) => {
    if (res.apiKey) {
      apiKeyInput.value = res.apiKey;
    }
  });

  // Save key on click
  saveBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    chrome.storage.local.set({ apiKey: key }, () => {
      statusEl.textContent = "✔️ API key saved.";
      setTimeout(() => (statusEl.textContent = ""), 2000);
    });
  });
} 