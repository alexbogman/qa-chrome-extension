const highlightBtn = document.getElementById("highlightBtn");
const randomPatientDataBtn = document.getElementById("randomPatientDataBtn");
const addHistoricImmunizationsBtn = document.getElementById(
  "addHistoricImmunizationsBtn",
);
let highlightEnabled: boolean = false;

chrome.storage.local.get("isHighlightingEnabled", (result) => {
  highlightEnabled = result.isHighlightingEnabled ?? false;
  updateHighlightButton();
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0]?.id;
  if (typeof tabId === "number") {
    chrome.tabs.sendMessage(tabId, {
      action: "toggleHighlight",
      enabled: highlightEnabled,
    });
  }
});

if (highlightBtn) {
  highlightBtn.addEventListener("click", () => {
    highlightEnabled = !highlightEnabled;
    chrome.storage.local.set({ isHighlightingEnabled: highlightEnabled });
    updateHighlightButton();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleHighlight",
          enabled: highlightEnabled,
        });
      }
    });
  });
} else {
  console.error("Highlight button not found");
}

if (randomPatientDataBtn) {
  randomPatientDataBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(tabId, { action: "randomPatientData" });
      }
    });
  });
} else {
  console.error("Random Patient Data button not found");
}

if (addHistoricImmunizationsBtn) {
  addHistoricImmunizationsBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(tabId, { action: "addHistoricImmunizations" });
      }
    });
  });
}

function updateHighlightButton() {
  if (highlightBtn) {
    highlightBtn.textContent = highlightEnabled
      ? `Highlight elements with data-automation-id (OFF)`
      : `Highlight elements with data-automation-id (ON)`;
  }
}
