const highlightBtn = document.getElementById("highlightBtn");
const randomPatientDataBtn = document.getElementById("randomPatientDataBtn");
const addHistoricImmunizationsBtn = document.getElementById(
  "addHistoricImmunizationsBtn"
);
const getPatientDemographicBtn = document.getElementById(
  "getPatientDemographic"
);
const getInsuranceBtn = document.getElementById("getInsurance");
const getImmunizationsBtn = document.getElementById("getImmunizations");

let highlightEnabled: boolean = false;

function updateHighlightButton() {
  if (highlightBtn) {
    highlightBtn.textContent = highlightEnabled ? "Disable" : "Enable";
  }
}

chrome.storage.local.get("isHighlightingEnabled", (result) => {
  highlightEnabled = result.isHighlightingEnabled ?? false;
  updateHighlightButton();
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

if (getPatientDemographicBtn) {
  getPatientDemographicBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(
          tabId,
          { action: "getPatientDemographic" },
          (response) => {
            console.log("Response from content script:", response);
            if (response?.data) {
              console.log("Patient demographic received:", response.data);
            }
          }
        );
      }
    });
  });
}

if (getInsuranceBtn) {
  getInsuranceBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(
          tabId,
          { action: "getInsurance" },
          (response) => {
            console.log("Response from content script:", response);
            if (response?.data) {
              console.log("Insurance received:", response.data);
            }
          }
        );
      }
    });
  });
}

if (getImmunizationsBtn) {
  getImmunizationsBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId === "number") {
        chrome.tabs.sendMessage(
          tabId,
          { action: "getImmunizations" },
          (response) => {
            console.log("Response from content script:", response);
            if (response?.data) {
              console.log("Immunizations received:", response.data);
            }
          }
        );
      }
    });
  });
}
