const highlightBtn = document.getElementById("highlightBtn");
const randomPatientDataBtn = document.getElementById("randomPatientDataBtn");
const addHistoricImmunizationsBtn = document.getElementById(
  "addHistoricImmunizationsBtn"
);
const getPatientInfoBtn = document.getElementById("getPatientInfo");

let highlightEnabled: boolean = false;
function copyToClipboard(text: string) {
  const tempInput = document.createElement("input");
  tempInput.style.position = "fixed";
  tempInput.style.opacity = "0";
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}
function updateHighlightButton() {
  if (highlightBtn) {
    highlightBtn.textContent = highlightEnabled ? "Disable" : "Enable";
  }
}

chrome.storage.local.get("isHighlightingEnabled", (result) => {
  highlightEnabled = result.isHighlightingEnabled ?? false;
  updateHighlightButton();
});

if (getPatientInfoBtn) {
  getPatientInfoBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(
          tabId,
          { action: "getPatientInfo" },
          (response) => {
            console.log("Response from content script:", response);
            if (response?.data) {
              console.log("Patient info received:", response.data);
              copyToClipboard(response.data);
            }
          }
        );
      }
    });
  });
}


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
