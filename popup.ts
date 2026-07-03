const highlightToggle = document.getElementById(
  "highlightToggle",
) as HTMLInputElement | null;
const randomPatientDataBtn = document.getElementById("randomPatientDataBtn");
const addHistoricImmunizationsBtn = document.getElementById(
  "addHistoricImmunizationsBtn",
);
const statusEl = document.getElementById("status");

let highlightEnabled = false;

function setStatus(message: string, type: "success" | "error" | "" = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = type ? `status status--${type}` : "status";
}

function sendToActiveTab(
  message: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId !== "number") {
        resolve({ success: false, error: "No active tab found" });
        return;
      }
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: "Extension not available on this page",
          });
          return;
        }
        resolve(response ?? { success: true });
      });
    });
  });
}

function syncHighlightToTab() {
  sendToActiveTab({ action: "toggleHighlight", enabled: highlightEnabled });
}

function updateHighlightToggle() {
  if (highlightToggle) {
    highlightToggle.checked = highlightEnabled;
  }
}

chrome.storage.local.get("isHighlightingEnabled", (result) => {
  highlightEnabled = result.isHighlightingEnabled ?? false;
  updateHighlightToggle();
  syncHighlightToTab();
});

if (highlightToggle) {
  highlightToggle.addEventListener("change", () => {
    highlightEnabled = highlightToggle.checked;
    chrome.storage.local.set({ isHighlightingEnabled: highlightEnabled });
    syncHighlightToTab();
  });
}

async function runAction(
  button: HTMLElement | null,
  action: string,
  runningLabel: string,
  successLabel: string,
) {
  if (!button) return;

  button.setAttribute("disabled", "true");
  const originalText = button.textContent;
  button.textContent = runningLabel;
  setStatus("");

  const result = await sendToActiveTab({ action });

  button.removeAttribute("disabled");
  button.textContent = originalText;

  if (result.success) {
    setStatus(successLabel, "success");
  } else {
    setStatus(result.error ?? "Action failed", "error");
  }
}

if (randomPatientDataBtn) {
  randomPatientDataBtn.addEventListener("click", () => {
    runAction(
      randomPatientDataBtn,
      "randomPatientData",
      "Running…",
      "Patient form filled",
    );
  });
}

if (addHistoricImmunizationsBtn) {
  addHistoricImmunizationsBtn.addEventListener("click", () => {
    runAction(
      addHistoricImmunizationsBtn,
      "addHistoricImmunizations",
      "Running…",
      "Immunizations added",
    );
  });
}
